document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-menu .nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');

            // 1. Left panel ke sabhi buttons se active class remove karo aur click hone wale par lagao
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // 2. Dashboard aur Computers dono views ko pehle hide karo
            const allViews = document.querySelectorAll('.tab-view');
            allViews.forEach(view => view.style.display = 'none');

            // 3. Click kiye gaye tab ke hisab se sahi Screen show karo
            if (targetTab === 'dashboard') {
                document.getElementById('view-dashboard').style.display = 'block';
                loadDashboard();
            } else if (targetTab === 'computers') {
                document.getElementById('view-computers').style.display = 'block';
                renderComputersGrid();
            } else {
                // Filhal baqi tabs ke liye Dashboard dikhega jab tak unka screen design nahi ban jata
                document.getElementById('view-dashboard').style.display = 'block';
            }
        });
    });
});