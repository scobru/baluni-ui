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

function formatUnitPrice(unitPrice: string) {
  return Number(unitPrice);
}

function getMinMax(data: number[]) {
  return {
    min: Math.min(...data),
    max: Math.max(...data),
  };
}

export const InterestChart: React.FC<InterestChartProps> = ({ interestData }) => {
  if (!interestData) return null;
  const labels = interestData.map(data => data.timestamp);
  const interestValues = interestData.map(data => formatUnitPrice(data.interestEarned));
  const { min, max } = getMinMax(interestValues);

  const data = {
    labels,
    datasets: [
      {
        label: "Interest Earned",
        data: interestValues,
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
        min: min,
        max: max,
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
  const valuationValues = valuationData.map(data => formatUnitPrice(data.totalValuation));
  const { min, max } = getMinMax(valuationValues);

  const data = {
    labels,
    datasets: [
      {
        label: "Total Valuation",
        data: valuationValues,
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
        min: min,
        max: max,
        beginAtZero: false,
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
  const unitPriceValues = unitPriceData.map(data => formatUnitPrice(data.unitPrice));
  const { min, max } = getMinMax(unitPriceValues);

  const data = {
    labels,
    datasets: [
      {
        label: "Unit Price",
        data: unitPriceValues,
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
        min: min,
        max: max,
        beginAtZero: false,
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

  const baseLowerPriceValues = hyperPoolData.map(data => formatUnitPrice(data.baseLowerPrice));
  const baseUpperPriceValues = hyperPoolData.map(data => formatUnitPrice(data.baseUpperPrice));
  const limitLowerPriceValues = hyperPoolData.map(data => formatUnitPrice(data.limitLowerPrice));
  const limitUpperPriceValues = hyperPoolData.map(data => formatUnitPrice(data.limitUpperPrice));
  const currentPriceValues = hyperPoolData.map(data => formatUnitPrice(data.currentPrice));

  const allPrices = [
    ...baseLowerPriceValues,
    ...baseUpperPriceValues,
    ...limitLowerPriceValues,
    ...limitUpperPriceValues,
    ...currentPriceValues,
  ];

  const { min, max } = getMinMax(allPrices);

  const data = {
    labels,
    datasets: [
      {
        label: "Base Lower Price",
        data: baseLowerPriceValues,
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
        data: baseUpperPriceValues,
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
        data: limitLowerPriceValues,
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
        data: limitUpperPriceValues,
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
        data: currentPriceValues,
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
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        labels: {
          font: {
            size: 14,
            color: "white",
            backgrounColor: "black",
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
            color: "white",
            backgrounColor: "black",
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            weight: "bold",
          },
        },
        ticks: {
          font: {
            size: 12,
            color: "white",
            backgrounColor: "black",
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          },
        },
      },
      y: {
        min: min,
        max: max,
        beginAtZero: false,
        title: {
          display: true,
          text: "Price (USDC)",
          font: {
            size: 16,
            color: "white",
            backgrounColor: "black",
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            weight: "bold",
          },
        },
        ticks: {
          font: {
            size: 12,
            color: "white",
            backgrounColor: "black",
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
