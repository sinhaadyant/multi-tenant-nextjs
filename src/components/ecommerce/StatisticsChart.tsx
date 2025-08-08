"use client";
import React, { useMemo, memo } from "react";
import { ApexOptions } from "apexcharts";
import ChartTab from "../common/ChartTab";
import { DynamicChart } from "@/lib/dynamicImports";

// Memoized chart options to prevent unnecessary re-renders
const useChartOptions = (): ApexOptions => useMemo(() => ({
  legend: {
    show: false, // Hide legend
    position: "top",
    horizontalAlign: "left",
  },
  colors: ["#465FFF", "#9CB9FF"], // Define line colors
  chart: {
    fontFamily: "Outfit, sans-serif",
    height: 310,
    type: "line", // Set the chart type to 'line'
    toolbar: {
      show: false, // Hide chart toolbar
    },
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 800,
      animateGradually: {
        enabled: true,
        delay: 150
      },
      dynamicAnimation: {
        enabled: true,
        speed: 350
      }
    }
  },
  stroke: {
    curve: "straight", // Define the line style (straight, smooth, or step)
    width: [2, 2], // Line width for each dataset
  },
  fill: {
    type: "gradient",
    gradient: {
      opacityFrom: 0.55,
      opacityTo: 0,
    },
  },
  markers: {
    size: 0, // Size of the marker points
    strokeColors: "#fff", // Marker border color
    strokeWidth: 2,
    hover: {
      size: 6, // Marker size on hover
    },
  },
  grid: {
    xaxis: {
      lines: {
        show: false, // Hide grid lines on x-axis
      },
    },
    yaxis: {
      lines: {
        show: true, // Show grid lines on y-axis
      },
    },
  },
  dataLabels: {
    enabled: false, // Disable data labels
  },
  tooltip: {
    enabled: true, // Enable tooltip
    x: {
      format: "dd MMM yyyy", // Format for x-axis tooltip
    },
  },
  xaxis: {
    type: "datetime",
    categories: [
      "2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05",
      "2024-01-06", "2024-01-07", "2024-01-08", "2024-01-09", "2024-01-10",
      "2024-01-11", "2024-01-12", "2024-01-13", "2024-01-14", "2024-01-15",
      "2024-01-16", "2024-01-17", "2024-01-18", "2024-01-19", "2024-01-20",
      "2024-01-21", "2024-01-22", "2024-01-23", "2024-01-24", "2024-01-25",
      "2024-01-26", "2024-01-27", "2024-01-28", "2024-01-29", "2024-01-30", "2024-01-31"
    ],
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
    labels: {
      show: false,
    },
  },
  yaxis: {
    labels: {
      show: true,
      style: {
        colors: "#9CA3AF",
        fontSize: "12px",
        fontFamily: "Outfit, sans-serif",
      },
    },
  },
}), []);

// Memoized chart series data
const useChartSeries = () => useMemo(() => [
  {
    name: "Revenue",
    data: [
      30, 40, 35, 50, 49, 60, 70, 91, 125, 150, 180, 200, 220, 240, 260, 280, 300, 320, 340, 360, 380, 400, 420, 440, 460, 480, 500, 520, 540, 560
    ],
  },
  {
    name: "Sales",
    data: [
      20, 30, 25, 40, 39, 50, 60, 81, 115, 140, 170, 190, 210, 230, 250, 270, 290, 310, 330, 350, 370, 390, 410, 430, 450, 470, 490, 510, 530, 550
    ],
  },
], []);

const StatisticsChart: React.FC = memo(() => {
  const options = useChartOptions();
  const series = useChartSeries();

  return (
    <div className="col-span-12 xl:col-span-8">
      <div className="box">
        <div className="flex flex-wrap gap-4 2xl:gap-6">
          <ChartTab />
        </div>
        <div className="mb-6"></div>
        <div>
                  <div id="chartOne" className="-ml-5">
          <DynamicChart
            options={options}
            series={series}
            type="line"
            height={310}
          />
        </div>
        </div>
      </div>
    </div>
  );
});

StatisticsChart.displayName = 'StatisticsChart';

export default StatisticsChart;
