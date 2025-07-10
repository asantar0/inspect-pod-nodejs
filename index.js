const express = require('express');
const os = require('os');
const app = express();
const port = process.env.PORT || 3000;

// Enable trust proxy for better IP detection in containers
app.set('trust proxy', true);

// JSON Parser
app.use(express.json());

// System information
function getSystemInfo() {
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    type: os.type(),
    uptime: Math.floor(os.uptime()),
    totalMemory: Math.round(os.totalmem() / 1024 / 1024), // MB
    freeMemory: Math.round(os.freemem() / 1024 / 1024), // MB
    cpus: os.cpus().length,
    loadAverage: os.loadavg(),
    networkInterfaces: Object.keys(os.networkInterfaces()),
    userInfo: os.userInfo(),
    homedir: os.homedir(),
    tmpdir: os.tmpdir(),
    endianness: os.endianness()
  };
}

// Environment variables
function getEnvironmentInfo() {
  const relevantEnvVars = [
    'HOSTNAME',
    'KUBERNETES_SERVICE_HOST',
    'KUBERNETES_SERVICE_PORT',
    'KUBERNETES_PORT',
    'KUBERNETES_PORT_443_TCP',
    'KUBERNETES_PORT_443_TCP_ADDR',
    'KUBERNETES_PORT_443_TCP_PORT',
    'KUBERNETES_PORT_443_TCP_PROTO',
    'KUBERNETES_SERVICE_PORT_HTTPS',
    'KUBERNETES_SERVICE_HOST',
    'POD_NAME',
    'POD_NAMESPACE',
    'POD_IP',
    'NODE_NAME',
    'SERVICE_NAME',
    'SERVICE_PORT',
    'SERVICE_HOST',
    'PORT',
    'NODE_ENV',
    'PATH',
    'HOME',
    'USER',
    'PWD'
  ];

  const envInfo = {};
  relevantEnvVars.forEach(key => {
    if (process.env[key]) {
      envInfo[key] = process.env[key];
    }
  });

  return envInfo;
}

// Process information
function getProcessInfo() {
  return {
    pid: process.pid,
    ppid: process.ppid,
    version: process.version,
    platform: process.platform,
    arch: process.arch,
    title: process.title,
    argv: process.argv,
    execPath: process.execPath,
    cwd: process.cwd(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    uptime: process.uptime(),
    nodeVersion: process.versions.node,
    v8Version: process.versions.v8,
    opensslVersion: process.versions.openssl,
    zlibVersion: process.versions.zlib,
    httpParserVersion: process.versions.http_parser,
    modulesVersion: process.versions.modules,
    nghttp2Version: process.versions.nghttp2,
    napiVersion: process.versions.napi,
    llhttpVersion: process.versions.llhttp,
    unicodeVersion: process.versions.unicode,
    cldrVersion: process.versions.cldr,
    icuVersion: process.versions.icu,
    tzVersion: process.versions.tz,
    aresVersion: process.versions.ares,
    uvVersion: process.versions.uv
  };
}

// Networking information
function getNetworkInfo() {
  const interfaces = os.networkInterfaces();
  const networkInfo = {};
  
  Object.keys(interfaces).forEach(name => {
    networkInfo[name] = interfaces[name].map(iface => ({
      address: iface.address,
      netmask: iface.netmask,
      family: iface.family,
      mac: iface.mac,
      internal: iface.internal,
      cidr: iface.cidr
    }));
  });

  return networkInfo;
}

// Principal path w/information
app.get('/', (req, res) => {
  const timestamp = new Date().toISOString();
  const systemInfo = getSystemInfo();
  const envInfo = getEnvironmentInfo();
  const processInfo = getProcessInfo();
  const networkInfo = getNetworkInfo();

  const response = {
    timestamp,
    message: 'Test realizado en oficinas de Redjar',
    pod: {
      hostname: systemInfo.hostname,
      podName: process.env.POD_NAME || 'No disponible',
      podNamespace: process.env.POD_NAMESPACE || 'No disponible',
      podIP: process.env.POD_IP || 'No disponible',
      nodeName: process.env.NODE_NAME || 'No disponible'
    },
    system: systemInfo,
    environment: envInfo,
    process: processInfo,
    network: networkInfo,
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
  };

  res.json(response);
});

// System information
app.get('/system', (req, res) => {
  res.json(getSystemInfo());
});

// Env variables
app.get('/env', (req, res) => {
  res.json(getEnvironmentInfo());
});

// Process path information
app.get('/process', (req, res) => {
  res.json(getProcessInfo());
});

// Networking information
app.get('/network', (req, res) => {
  res.json(getNetworkInfo());
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    hostname: os.hostname()
  });
});

// Pod information
app.get('/pod', (req, res) => {
  res.json({
    hostname: os.hostname(),
    podName: process.env.POD_NAME || 'No disponible',
    podNamespace: process.env.POD_NAMESPACE || 'No disponible',
    podIP: process.env.POD_IP || 'No disponible',
    nodeName: process.env.NODE_NAME || 'No disponible',
    serviceName: process.env.SERVICE_NAME || 'No disponible',
    timestamp: new Date().toISOString()
  });
});

// Kubernetes information
app.get('/k8s', (req, res) => {
  const k8sInfo = {};
  
  // Buscar variables de entorno relacionadas con Kubernetes
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('KUBERNETES_') || key.includes('SERVICE_') || key.includes('POD_')) {
      k8sInfo[key] = process.env[key];
    }
  });

  res.json({
    kubernetes: k8sInfo,
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    availableRoutes: [
      '/',
      '/system',
      '/env',
      '/process',
      '/network',
      '/health',
      '/pod',
      '/k8s'
    ],
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port: ${port}`);
  console.log(`Hostname: ${os.hostname()}`);
  console.log(`Pod IP: ${process.env.POD_IP || 'No disponible'}`);
  console.log(`Pod Name: ${process.env.POD_NAME || 'No disponible'}`);
  console.log(`Namespace: ${process.env.POD_NAMESPACE || 'No disponible'}`);
  console.log(`Node: ${process.env.NODE_NAME || 'No disponible'}`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log(`Node.js version: ${process.version}`);
  console.log(`Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB used`);
});

// Graceful shutdown for Node.js 24
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
