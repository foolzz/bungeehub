// BungeeHub Interactive Mockup Scripts

// Theme Toggle
function toggleTheme() {
  document.body.classList.toggle('dark-theme');
  const isDark = document.body.classList.contains('dark-theme');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Initialize theme from localStorage
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
  }
});

// Sidebar Toggle for Mobile
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  sidebar.classList.toggle('open');
}

// Mock Data Generators
function generateRandomData(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function updateLiveStats() {
  // Simulate real-time updates
  const playerCountElement = document.getElementById('live-players');
  const serverCountElement = document.getElementById('live-servers');

  if (playerCountElement) {
    const currentPlayers = parseInt(playerCountElement.textContent);
    const change = generateRandomData(-5, 10);
    const newPlayers = Math.max(0, Math.min(500, currentPlayers + change));
    playerCountElement.textContent = newPlayers;
  }
}

// Refresh stats every 3 seconds
setInterval(updateLiveStats, 3000);

// Chart Animation
function animateCharts() {
  const bars = document.querySelectorAll('.chart-bar');
  bars.forEach((bar, index) => {
    setTimeout(() => {
      bar.style.transform = 'scaleY(1)';
      bar.style.opacity = '1';
    }, index * 50);
  });
}

// Initialize charts on load
document.addEventListener('DOMContentLoaded', () => {
  const bars = document.querySelectorAll('.chart-bar');
  bars.forEach(bar => {
    bar.style.transform = 'scaleY(0)';
    bar.style.opacity = '0';
    bar.style.transition = 'all 0.5s ease-out';
  });

  setTimeout(animateCharts, 300);
});

// Server Actions
function restartServer(serverName) {
  alert(`Restarting ${serverName}...`);
  // Simulate restart
  const statusDot = event.target.closest('.server-card').querySelector('.status-dot');
  statusDot.classList.remove('online');
  statusDot.classList.add('warning');

  setTimeout(() => {
    statusDot.classList.remove('warning');
    statusDot.classList.add('online');
    alert(`${serverName} restarted successfully!`);
  }, 2000);
}

function viewServerDetails(serverName) {
  window.location.href = `server-detail.html?server=${encodeURIComponent(serverName)}`;
}

function viewPlayerProfile(playerName) {
  window.location.href = `player-profile.html?player=${encodeURIComponent(playerName)}`;
}

// Search functionality
function handleSearch(event) {
  const searchTerm = event.target.value.toLowerCase();
  console.log('Searching for:', searchTerm);
  // In a real app, this would filter results
}

// Notification handling
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 16px 24px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-left: 4px solid var(--${type === 'success' ? 'success' : type === 'error' ? 'error' : 'info'});
    border-radius: 8px;
    box-shadow: var(--shadow-lg);
    z-index: 9999;
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Mock user actions
function kickPlayer(playerName) {
  if (confirm(`Are you sure you want to kick ${playerName}?`)) {
    showNotification(`${playerName} has been kicked from the network.`, 'success');
  }
}

function banPlayer(playerName) {
  if (confirm(`Are you sure you want to ban ${playerName}?`)) {
    showNotification(`${playerName} has been banned from the network.`, 'success');
  }
}

function sendMessage(playerName) {
  const message = prompt(`Send a message to ${playerName}:`);
  if (message) {
    showNotification(`Message sent to ${playerName}.`, 'success');
  }
}

// Table sorting
let sortDirection = {};

function sortTable(columnIndex, tableId = 'dataTable') {
  const table = document.getElementById(tableId);
  if (!table) return;

  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));

  const direction = sortDirection[columnIndex] === 'asc' ? 'desc' : 'asc';
  sortDirection[columnIndex] = direction;

  rows.sort((a, b) => {
    const aValue = a.cells[columnIndex].textContent.trim();
    const bValue = b.cells[columnIndex].textContent.trim();

    if (!isNaN(aValue) && !isNaN(bValue)) {
      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return direction === 'asc'
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  rows.forEach(row => tbody.appendChild(row));
}

// Export functionality
function exportData(format) {
  alert(`Exporting data as ${format.toUpperCase()}...`);
  showNotification(`Data exported successfully as ${format.toUpperCase()}.`, 'success');
}

// Filter handlers
function applyFilters() {
  showNotification('Filters applied successfully.', 'info');
}

function clearFilters() {
  const inputs = document.querySelectorAll('.filter-input');
  inputs.forEach(input => input.value = '');
  showNotification('Filters cleared.', 'info');
}

// Navigation active state
document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
});

// Add smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

console.log('🎮 BungeeHub Mockup Loaded Successfully!');
