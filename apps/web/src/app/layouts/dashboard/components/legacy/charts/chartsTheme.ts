const useChartTheme = (isDarkMode) => ({
  mode: isDarkMode ? 'dark' : 'light',
  background: 'transparent',
  fontFamily: 'inherit',
  foreColor: isDarkMode ? '#cbd5e1' : '#475569',
  xaxis: {
    labels: {
      style: {
        fontSize: '12px',
      },
    },
  },
  grid: {
    borderColor: isDarkMode ? '#334155' : '#e2e8f0',
    strokeDashArray: 4,
    yaxis: {
      lines: {
        show: true,
      },
    },
    xaxis: {
      lines: {
        show: false,
      },
    },
    padding: {
      top: 10,
      right: 10,
      bottom: 10,
      left: 10,
    },
  },
  legend: {
    fontSize: '13px',
    fontWeight: 500,
    offsetY: 4,
    markers: {
      radius: 2,
      width: 12,
      height: 12,
    },
    itemMargin: {
      horizontal: 8,
    },
  },
});

export default useChartTheme;
