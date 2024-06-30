import React from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  TimeScale,
  Title,
  Tooltip,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { ethers } from "ethers";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale, Filler);

interface ValuationData {
  timestamp: string;
  totalValuation: string;
  address: string;
}

interface InterestData {
  timestamp: string;
  interestEarned: string;
  address: string;
}

interface UnitPriceData {
  timestamp: string;
  unitPrice: string;
  address: string;
}

interface ValuationChartProps {
  valuationData: ValuationData[];
}

interface InterestChartProps {
  interestData: InterestData[];
}

interface UnitPriceChartProps {
  unitPriceData: UnitPriceData[];
}

export const InterestChart: React.FC<InterestChartProps> = ({ interestData }) => {
  if (!interestData) return null;
  const labels = interestData.map(data => data.timestamp);
  const data = {
    labels,
    datasets: [
      {
        label: "Interest Earned",
        data: interestData.map(data => ethers.utils.formatUnits(data.interestEarned, 6)),
        fill: true,
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        pointBackgroundColor: "rgba(75, 192, 192, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: "white",
          font: {
            size: 14,
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            weight: "bold",
          },
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        titleFont: {
          size: 16,
          family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          weight: "bold",
        },
        bodyFont: {
          size: 14,
          family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
        },
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: "minute",
          displayFormats: {
            minute: "MMM d, h:mm a",
          },
        },
        title: {
          display: true,
          text: "Timestamp",
          color: "white",
          font: {
            size: 16,
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            weight: "bold",
          },
        },
        ticks: {
          color: "white",
          font: {
            size: 12,
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          },
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Interest Earned (USDC)",
          color: "white",
          font: {
            size: 16,
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            weight: "bold",
          },
        },
        ticks: {
          color: "white",
          font: {
            size: 12,
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          },
          callback: function (value: any) {
            return "$" + value;
          },
        },
      },
    },
  } as any;

  return (
    <div style={{ height: "400px", width: "100%" }}>
      <Line data={data} options={options} />
    </div>
  );
};

export const ValuationChart: React.FC<ValuationChartProps> = ({ valuationData }) => {
  if (!valuationData) return null;
  const labels = valuationData.map(data => data.timestamp);

  const data = {
    labels,
    datasets: [
      {
        label: "Total Valuation",
        data: valuationData.map(data => ethers.utils.formatUnits(data.totalValuation, 6)),
        fill: true,
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        pointBackgroundColor: "rgba(75, 192, 192, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: "white",
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: "minute",
          displayFormats: {
            minute: "MMM d, h:mm a",
          },
        },
        title: {
          display: true,
          text: "Timestamp",
          color: "white",
        },
        ticks: {
          color: "white",
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Total Valuation (USDC)",
          color: "white",
        },
        ticks: {
          color: "white",
          callback: function (value: any) {
            return "$" + value;
          },
        },
      },
    },
  } as any;

  return (
    <div style={{ height: "400px", width: "100%" }}>
      <Line data={data} options={options} />
    </div>
  );
};

export const UnitPriceChart: React.FC<UnitPriceChartProps> = ({ unitPriceData }) => {
  if (!unitPriceData) return null;
  const labels = unitPriceData.map(data => data.timestamp);
  const data = {
    labels,
    datasets: [
      {
        label: "Unit Price",
        data: unitPriceData.map(data => ethers.utils.formatUnits(data.unitPrice, 18)),
        fill: true,
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        pointBackgroundColor: "rgba(75, 192, 192, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 2,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(0, 0, 0, 0.7)",

        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: "minute",
          displayFormats: {
            minute: "MMM d, h:mm a",
          },
        },
        title: {
          display: true,
          text: "Timestamp",
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Unit Price (USDC)",
        },
        ticks: {
          callback: function (value: any) {
            return "$" + value;
          },
        },
      },
    },
  } as any;

  return (
    <div style={{ height: "400px", width: "100%" }}>
      <Line data={data} options={options} />
    </div>
  );
};
