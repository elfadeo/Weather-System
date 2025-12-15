import Papa from 'papaparse'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function useExport() {
  /**
   * Export data to CSV
   */
  const exportCSV = (data, groupByValue) => {
    const csv = Papa.unparse(
      data.map(({ period, temperature, humidity, rainfallRate, periodRainfall, count }) => ({
        Period: period,
        'Avg Temperature (°C)': temperature,
        'Avg Humidity (%)': humidity,
        'Avg Rainrate (mm/hr)': rainfallRate,
        'Period Rainfall (mm)': periodRainfall,
        'Number of Readings': count,
      })),
    )

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)

    const timestamp = new Date().toISOString().split('T')[0]
    link.setAttribute('download', `weather_report_${groupByValue}_${timestamp}.csv`)

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /**
   * Export data to PDF
   */
  const exportPDF = (data, groupByValue, dataTimeRange, rawDataLength) => {
    const doc = new jsPDF()

    // Header
    doc.setFontSize(18)
    doc.text('Weather Data Report', 14, 20)

    // Metadata
    doc.setFontSize(10)
    doc.text(`Grouping: ${groupByValue.charAt(0).toUpperCase() + groupByValue.slice(1)}`, 14, 28)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34)
    doc.text(`Data Range: ${dataTimeRange}`, 14, 40)
    doc.text(`Total Periods: ${data.length}`, 14, 46)
    doc.text(`Total Readings: ${rawDataLength}`, 14, 52)

    // Table
    const tableColumn = [
      'Period',
      'Avg. Temp (°C)',
      'Avg. Humidity (%)',
      'Avg. Rain Rate (mm/hr)',
      'Period Rainfall (mm)',
      'Readings',
    ]

    const tableRows = data.map((row) => [
      row.period,
      row.temperature,
      row.humidity,
      row.rainfallRate,
      row.periodRainfall,
      row.count,
    ])

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 58,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [59, 130, 246] },
    })

    const timestamp = new Date().toISOString().split('T')[0]
    doc.save(`weather_report_${groupByValue}_${timestamp}.pdf`)
  }

  return {
    exportCSV,
    exportPDF,
  }
}
