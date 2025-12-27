
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US').format(amount) + ' SSP';
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
