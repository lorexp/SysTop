const path = require('path');
const { ipcRenderer } = require('electron');
const osu = require('node-os-utils');

const cpu = osu.cpu;
const mem = osu.mem;
const os = osu.os;

let cpuOverload;
let alertFrequency;

// Get settings and values
ipcRenderer.on('settings:get', (e, settings) => {
  cpuOverload = +settings.cpuOverload;
  alertFrequency = +settings.alertFrequency;
});

// Run every two seconds

setInterval(() => {
  // CPU USAGE
  cpu.usage().then((info) => {
    document.getElementById('cpu-usage').innerText = `${info}%`;

    const progressBar = document.getElementById('cpu-progress');

    progressBar.style.width = info + '%';

    // make progress bar red if overload
    if (info > cpuOverload) {
      progressBar.style.background = 'red';
    } else {
      progressBar.style.background = '#30c88b';
    }

    // check overload
    if (info > cpuOverload && runNotify(alertFrequency)) {
      notifyUser({
        title: 'Cpu overload',
        body: `CPU is over ${cpuOverload}%`,
        icon: path.join(__dirname, 'img', 'icon.png'),
      });

      localStorage.setItem('lastNotify', +new Date());
    }
  });

  // free cpy
  cpu.free().then((info) => {
    document.getElementById('cpu-free').innerText = `${info}% `;
  });

  // uptime
  document.getElementById('sys-uptime').innerText = secondsToDhms(os.uptime());
}, 2000);

// Set model
document.getElementById('cpu-model').innerHTML = cpu.model();

// Computer name
document.getElementById('comp-name').innerHTML = os.hostname();

// OS
document.getElementById('os').innerHTML = `${os.type()} ${os.arch()}`;

// total memory
mem.info().then((info) => {
  document.getElementById('mem-total').innerHTML = `${info.totalMemMb} MB`;
});

// show days, hour, mins, sec

function secondsToDhms(seconds) {
  seconds = +seconds;
  const d = Math.floor(seconds / (3600 / 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  return `${d}d, ${h}h, ${m}m, ${s}s`;
}

// send notification

function notifyUser(options) {
  new Notification(options.title, options);
}

// check how much time has passed since notification
function runNotify(frequency) {
  if (localStorage.getItem('lastNotify') === null) {
    // store timestamp
    localStorage.setItem('lastNotify', +new Date());

    return true;
  }

  const notifyTime = new Date(parseInt(localStorage.getItem('lastNotify')));
  const now = new Date();
  const diffTime = Math.abs(now - notifyTime);
  const minutesPassed = Math.ceil(diffTime / (1000 * 60));

  if (minutesPassed > frequency) return true;

  return false;
}
