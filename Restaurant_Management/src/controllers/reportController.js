const reportService = require('../services/reportService');
const inventoryService = require('../services/inventoryService');
const { exportToCsv } = require('../utils/csvExporter');

class ReportController {
  // Show reports page
  async showReports(req, res) {
    try {
      const period = req.query.period || 'daily';
      const [salesReport, topItems, categories] = await Promise.all([
        reportService.getSalesReport(period),
        reportService.getTopSellingItems(),
        reportService.getMostOrderedCategories()
      ]);

      res.render('admin/reports', {
        title: 'Reports',
        salesReport,
        topItems,
        categories,
        currentPeriod: period,
        layout: 'layouts/main'
      });
    } catch (err) {
      console.error('Report error:', err);
      req.flash('error', 'Failed to load reports');
      res.redirect('/admin');
    }
  }

  // Export sales CSV
  async exportSalesCsv(req, res) {
    try {
      const period = req.query.period || 'daily';
      const report = await reportService.getSalesReport(period);
      
      const csvData = report.orders.map(o => ({
        'Order Number': o.order_number,
        'Customer': o.users?.name || 'N/A',
        'Amount': `$${parseFloat(o.total_amount).toFixed(2)}`,
        'Status': o.status,
        'Date': new Date(o.created_at).toLocaleString()
      }));

      const csv = exportToCsv(csvData);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=sales_report_${period}_${Date.now()}.csv`);
      res.send(csv);
    } catch (err) {
      req.flash('error', 'Failed to export report');
      res.redirect('/admin/reports');
    }
  }

  // Export inventory CSV
  async exportInventoryCsv(req, res) {
    try {
      const items = await inventoryService.getAllItems();
      
      const csvData = items.map(item => ({
        'Item Name': item.item_name,
        'Quantity': item.quantity,
        'Unit': item.unit,
        'Minimum Stock': item.minimum_stock,
        'Status': parseFloat(item.quantity) < parseFloat(item.minimum_stock) ? 'LOW' : 'OK',
        'Last Updated': new Date(item.updated_at).toLocaleString()
      }));

      const csv = exportToCsv(csvData);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=inventory_report_${Date.now()}.csv`);
      res.send(csv);
    } catch (err) {
      req.flash('error', 'Failed to export inventory');
      res.redirect('/admin/reports');
    }
  }

  // API: Sales report
  async apiSalesReport(req, res) {
    try {
      const period = req.query.period || 'daily';
      const report = await reportService.getSalesReport(period);
      res.json(report);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  // API: Top items
  async apiTopItems(req, res) {
    try {
      const items = await reportService.getTopSellingItems();
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new ReportController();
