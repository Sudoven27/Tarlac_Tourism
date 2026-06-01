export const MUNICIPALITIES = [
  'Tarlac City', 'Capas', 'Bamban', 'Camiling', 'Concepcion', 'Gerona',
  'La Paz', 'Mayantoc', 'Moncada', 'Paniqui', 'Pura', 'Ramos',
  'San Clemente', 'San Jose', 'San Manuel', 'Santa Ignacia', 'Victoria'
];

export const SAE_TYPES = ['Hotel', 'Resort', 'Motel', 'Tourist Inn', 'Pension House', 'Hostel', 'Apartelle', 'Others'];

export const STA_TYPES = ['Nature', 'History_and_Culture', 'Man-Made', 'Events_and_Festivals', 'Sports_and_Recreation', 'Others'];

export const STE_TYPES = ['Travel and Tours', 'Restaurant', 'Transportation', 'Souvenir Shop', 'Spa and Wellness', 'Entertainment', 'Others'];

export const DEVT_LEVELS = ['Undeveloped', 'Developing', 'Developed', 'Highly Developed'];

export const TYPE_LABELS = {
  Nature: 'Nature',
  History_and_Culture: 'History & Culture',
  'Man-Made': 'Man-Made',
  Events_and_Festivals: 'Events & Festivals',
  Sports_and_Recreation: 'Sports & Recreation',
  Others: 'Others'
};

export const REPORT_YEARS = [2024, 2025, 2026, 2027];

export const MUN_COLORS = [
  '#059669','#0891b2','#7c3aed','#d97706','#dc2626',
  '#16a34a','#0284c7','#9333ea','#ca8a04','#b91c1c',
  '#065f46','#164e63','#581c87','#92400e','#991b1b'
];

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function getTypeLabel(type) {
  return TYPE_LABELS[type] || type?.replace(/_/g, ' ') || '—';
}

export function getBadgeClass(type) {
  const map = {
    Hotel: 'badge-blue', Resort: 'badge-green', Motel: 'badge-gray',
    'Tourist Inn': 'badge-gold', Nature: 'badge-green',
    History_and_Culture: 'badge-gold', 'Travel and Tours': 'badge-blue',
    Restaurant: 'badge-gold', submitted: 'badge-green',
    approved: 'badge-blue', draft: 'badge-gray'
  };
  return map[type] || 'badge-gray';
}
