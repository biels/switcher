let defaultInternalIp = '192.168.150';

interface Domain {
    _ip?: string
    self?: boolean // Default true
    enable?: boolean

    [domainPart: string]: Domain | any
}

let domains: Domain = {
    _ip: '192.168.1.150',
    'protocolapp.net': {
        'ci': {},
        'demo': {},
        'next': {},
        'dev': {},
        'beta': {},
        's3': {},
    },
    'barcelonainernationalsocial.com': {
        enable: false,
        'bis': {},
        'bis-dev': {},
    }
}
export let genHosts = (d = domains) => {
    // Transform domains to a string including nested domains
    let domainsString = ''
    let getAllEntriesForDomain = (nameKey, domainObj: Domain, context: { ip, path }) => {
        let entries = []
        if (domainObj.enable === false) return entries
        let newContext = {...context}
        newContext.path = [nameKey, ...context.path].filter(a => a)
        newContext.ip = domainObj['_ip'] || context.ip

        let pushSelf = domainObj['self'] ?? true
        if (pushSelf && nameKey) {
            entries.push(`${newContext.ip} ${newContext.path.join('.')}`)
        }
        for (let key in domainObj) {
            if (['_ip', 'self', 'enable'].includes(key)) continue
            entries.push(...getAllEntriesForDomain(key, domainObj[key], newContext))
        }
        return entries
    }
    let hosts = getAllEntriesForDomain('', d, {ip: defaultInternalIp, path: []}).join('\n');
    return ['# Switcher LAN Hosts', hosts, '# End of switcher LAN Hosts'].join('\n')
}
console.log(genHosts(domains));
