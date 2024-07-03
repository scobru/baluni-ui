import type React from "react";
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

interface HyperPoolData {
  timestamp: string;
  baseLowerPrice: string;
  baseUpperPrice: string;
  limitLowerPrice: string;
  limitUpperPrice: string;
  currentPrice: string;
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

interface HyperPoolChartProps {
  hyperPoolData: HyperPoolData[];
}

function formatUnitPrice(unitPrice) {
  if (!isNaN(Number(unitPrice))) {
    // unitPrice è un numero
    return Number(unitPrice);
  } else {
    try {
      // Prova a convertirlo in BigInt
      let bigIntValue = BigInt(unitPrice);
      return ethers.utils.formatUnits(bigIntValue.toString(), 6);
    } catch (e) {
      // unitPrice non è né un numero né un BigInt valido
      throw new Error("unitPrice non è un numero valido o BigInt");
    }
  }
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
          label: (context: any) => {
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

          font: {
            size: 16,
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            weight: "bold",
          },
        },
        ticks: {
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

          font: {
            size: 16,
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            weight: "bold",
          },
        },
        ticks: {
          font: {
            size: 12,
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          },
          callback: (value: any) => "$" + value,
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
        data: valuationData.map(data => formatUnitPrice(data.totalValuation)),
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
        labels: {},
      },
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        callbacks: {
          label: (context: any) => {
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
        ticks: {},
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Total Valuation (USDC)",
        },
        ticks: {
          callback: (value: any) => "$" + value,
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
        data: unitPriceData.map(data => formatUnitPrice(data.unitPrice)),
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
          label: (context: any) => {
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
          callback: (value: any) => "$" + value,
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

export const HyperPoolChart: React.FC<HyperPoolChartProps> = ({ hyperPoolData }) => {
  console.log("HyperPoolData", hyperPoolData);
  if (!hyperPoolData) return null;
  const labels = hyperPoolData.map(data => data.timestamp);
  const data = {
    labels,
    datasets: [
      {
        label: "Base Lower Price",
        data: hyperPoolData.map(data => formatUnitPrice(data.baseLowerPrice)),
        fill: false,
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        pointBorderColor: "rgba(255, 99, 132, 1)",
        pointBackgroundColor: "rgba(255, 99, 132, 1)",
        borderWidth: 2,
        tension: 0.4,
      },
      {
        label: "Base Upper Price",
        data: hyperPoolData.map(data => formatUnitPrice(data.baseUpperPrice)),
        fill: false,
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        pointBorderColor: "rgba(54, 162, 235, 1)",
        pointBackgroundColor: "rgba(54, 162, 235, 1)",
        borderWidth: 2,
        tension: 0.4,
      },
      {
        label: "Limit Lower Price",
        data: hyperPoolData.map(data => formatUnitPrice(data.limitLowerPrice)),
        fill: false,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        pointBorderColor: "rgba(75, 192, 192, 1)",
        pointBackgroundColor: "rgba(75, 192, 192, 1)",
        borderWidth: 2,
        tension: 0.4,
      },
      {
        label: "Limit Upper Price",
        data: hyperPoolData.map(data => formatUnitPrice(data.limitUpperPrice)),
        fill: false,
        borderColor: "rgba(153, 102, 255, 1)",
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        pointBorderColor: "rgba(153, 102, 255, 1)",
        pointBackgroundColor: "rgba(153, 102, 255, 1)",
        borderWidth: 2,
        tension: 0.4,
      },
      {
        label: "Current Price",
        data: hyperPoolData.map(data => formatUnitPrice(data.currentPrice)),
        fill: false,
        borderColor: "rgba(255, 206, 86, 1)",
        backgroundColor: "rgba(255, 206, 86, 0.2)",
        pointBorderColor: "rgba(255, 206, 86, 1)",
        pointBackgroundColor: "rgba(255, 206, 86, 1)",
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
          label: (context: any) => {
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
          font: {
            size: 16,
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            weight: "bold",
          },
        },
        ticks: {
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
          text: "Price (USDC)",
          font: {
            size: 16,
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            weight: "bold",
          },
        },
        ticks: {
          font: {
            size: 12,
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          },
          callback: (value: any) => "$" + value,
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
