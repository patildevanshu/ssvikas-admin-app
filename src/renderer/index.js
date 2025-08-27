(async function () {
  // Wait DB
  const ok = await window.api.dbReady();
  document.getElementById('dbStatus').textContent = ok ? 'Connected' : 'Error';

  // Add Farmer
  document.getElementById('farmerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    const res = await window.api.farmerCreate(data);
    alert('Farmer saved: ' + res.name);
    e.target.reset();
  });

  // Load Farmers
  document.getElementById('loadFarmers').addEventListener('click', async () => {
    const list = await window.api.farmerList();
    const ul = document.getElementById('farmerList');
    ul.innerHTML = list.map(f => `<li>${f.name} (${f.mobile||'-'})</li>`).join('');
  });

  // Reports
  document.getElementById('dailyReport').addEventListener('click', async () => {
    const today = new Date().toISOString().slice(0,10);
    const data = await window.api.reportDaily({ from: today, to: today });
    document.getElementById('reportOut').textContent = JSON.stringify(data, null, 2);
  });
})();
