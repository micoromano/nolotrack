#!/usr/bin/env python3
"""
Controllo di coerenza dei manifest Kubernetes renderizzati (senza cluster).

    kubectl kustomize deploy/k8s/overlays/produzione | python3 scripts/k8s-verifica.py -

Verifica che: ogni $(VAR) nelle env sia definita prima (env/envFrom); le chiavi
obbligatorie di ConfigMap/Secret esistano; le porte di probe, Service e Ingress
esistano; i selettori trovino i pod; ConfigMap e PVC montati esistano.
Non sostituisce la validazione dello schema API (kubeconform / dry-run sul server).
Richiede PyYAML (pip install pyyaml).
"""
import re, sys, yaml
docs = [d for d in yaml.safe_load_all((sys.stdin if sys.argv[1] == '-' else open(sys.argv[1]))) if d]
by = lambda k: [d for d in docs if d['kind'] == k]
cms = {d['metadata']['name']: d.get('data', {}) for d in by('ConfigMap')}
secs = {d['metadata']['name']: d.get('data', {}) for d in by('Secret')}
errs = []
def pod_specs():
    for d in docs:
        k = d['kind']
        if k in ('Deployment', 'StatefulSet'): yield d, d['spec']['template']
        if k == 'CronJob': yield d, d['spec']['jobTemplate']['spec']['template']
for owner, tpl in pod_specs():
    spec = tpl['spec']; name = f"{owner['kind']}/{owner['metadata']['name']}"
    for c in spec.get('initContainers', []) + spec['containers']:
        defined = set()
        for ef in c.get('envFrom', []):
            if 'configMapRef' in ef:
                n = ef['configMapRef']['name']
                if n not in cms: errs.append(f"{name}: envFrom ConfigMap {n} inesistente")
                defined |= set(cms.get(n, {}))
        for e in c.get('env', []):
            v = e.get('value')
            if isinstance(v, str):
                for ref in re.findall(r'\$\((\w+)\)', v):
                    if ref not in defined: errs.append(f"{name}/{c['name']}: $({ref}) usata in {e['name']} prima di essere definita")
            vf = e.get('valueFrom', {})
            for kind, store in (('configMapKeyRef', cms), ('secretKeyRef', secs)):
                if kind in vf:
                    r = vf[kind]
                    if r['name'] not in store: errs.append(f"{name}: {kind} {r['name']} inesistente")
                    elif r['key'] not in store[r['name']] and not r.get('optional'):
                        errs.append(f"{name}: chiave obbligatoria {r['key']} assente in {r['name']}")
            defined.add(e['name'])
        ports = {p.get('name') for p in c.get('ports', [])} | {p['containerPort'] for p in c.get('ports', [])}
        for pr in ('readinessProbe', 'livenessProbe'):
            p = c.get(pr, {})
            for t in ('httpGet', 'tcpSocket'):
                if t in p and p[t]['port'] not in ports: errs.append(f"{name}: {pr} porta {p[t]['port']} non dichiarata")
    for v in spec.get('volumes', []):
        if 'configMap' in v and v['configMap']['name'] not in cms: errs.append(f"{name}: volume ConfigMap {v['configMap']['name']} inesistente")
        if 'persistentVolumeClaim' in v and v['persistentVolumeClaim']['claimName'] not in {d['metadata']['name'] for d in by('PersistentVolumeClaim')}:
            errs.append(f"{name}: PVC inesistente")
    if owner['kind'] != 'CronJob':
        sel = owner['spec']['selector']['matchLabels']
        if not all(tpl['metadata']['labels'].get(k) == v for k, v in sel.items()): errs.append(f"{name}: selector non corrisponde alle label")
for s in by('Service'):
    sel = s['spec']['selector']
    pods = [(o, t) for o, t in pod_specs() if o['kind'] != 'CronJob' and all(t['metadata']['labels'].get(k) == v for k, v in sel.items())]
    if not pods: errs.append(f"Service/{s['metadata']['name']}: nessun pod selezionato")
    for o, t in pods:
        cports = {p['containerPort'] for c in t['spec']['containers'] for p in c.get('ports', [])}
        for p in s['spec']['ports']:
            if p.get('targetPort', p['port']) not in cports: errs.append(f"Service/{s['metadata']['name']}: porta {p['port']} non esposta dal pod")
svcs = {s['metadata']['name']: {p.get('name') for p in s['spec']['ports']} for s in by('Service')}
for ing in by('Ingress'):
    for r in ing['spec']['rules']:
        for p in r['http']['paths']:
            b = p['backend']['service']
            if b['name'] not in svcs or b['port'].get('name') not in svcs[b['name']]: errs.append(f"Ingress: backend {b} non valido")
print("\n".join(errs) if errs else f"OK: {len(docs)} risorse coerenti"); sys.exit(1 if errs else 0)
