import { toast } from 'sonner';

interface PackingListData {
  consignee: string;
  consigneeAddress: string;
  consigneePhone: string;
  consigneeEmail: string;
  consigneeContract: string;
  consigner: string;
  consignerAddress: string;
  consignerPhone: string;
  consignerEmail: string;
  consignerContract: string;
  shippedTo: string;
  shippedToAddress: string;
  shippedToPhone: string;
  shippedToEmail: string;
  shippedToContract: string;
  customerOpNo: string;
  typeOfShipment: string;
  portLoading: string;
  portDestination: string;
  pallets: Array<{
    id: string;
    boxNumberFrom: number;
    boxNumberTo: number;
    products: Array<{
      id: string;
      productCode: string;
      description: string;
      batch: string;
      quantity: number;
      weightPerBox: number;
      totalGrossWeight: number;
      hasMixedProducts: boolean;
      secondProduct?: {
        productCode: string;
        description: string;
        batch: string;
        weightPerBox: number;
        totalGrossWeight: number;
      };
    }>;
  }>;
  totalGrossWeight: number;
  boxSize: string;
  shippingMark: string;
  airport: string;
  destination: string;
  countryOfOrigin: string;
}

interface Totals {
  totalBoxes: number;
  totalPallets: number;
  totalNetWeight: number;
}

export function generatePackingListPDF(data: PackingListData, totals: Totals) {
  try {
    // Create a new window for the PDF content
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      toast.error("Please allow popups to generate PDF");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Packing List</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 15px;
            font-size: 10px;
            line-height: 1.2;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
            border: 2px solid #000;
            padding: 8px;
          }
          .header h1 {
            margin: 0;
            font-size: 18px;
            font-weight: bold;
          }
          .company-section {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
          }
          .company-box {
            border: 1px solid #000;
            padding: 8px;
            min-height: 90px;
          }
          .company-title {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 6px;
            text-decoration: underline;
          }
          .company-info {
            font-size: 9px;
            line-height: 1.2;
          }
          .shipping-details {
            border: 1px solid #000;
            padding: 8px;
            margin-bottom: 15px;
            background-color: #f8f9fa;
          }
          .shipping-title {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 8px;
            text-align: center;
          }
          .shipping-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          .shipping-item {
            display: flex;
            margin-bottom: 4px;
          }
          .shipping-label {
            font-weight: bold;
            min-width: 100px;
            margin-right: 8px;
            font-size: 9px;
          }
          .shipping-value {
            flex: 1;
            border-bottom: 1px solid #ccc;
            padding-bottom: 1px;
            font-size: 9px;
          }

          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          .table th,
          .table td {
            border: 1px solid #000;
            padding: 3px;
            text-align: center;
            font-size: 7px;
          }
          .table th {
            background-color: #e0e0e0;
            font-weight: bold;
            font-size: 9px;
          }
          .table tfoot td {
            background-color: #f0f0f0;
            font-weight: bold;
            font-size: 8px;
            border-top: 2px solid #000;
          }
          .summary-section {
            margin-top: 15px;
            border: 2px solid #000;
            padding: 10px;
          }
          .summary-title {
            font-weight: bold;
            font-size: 12px;
            text-align: center;
            margin-bottom: 10px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .summary-item {
            display: flex;
            margin-bottom: 6px;
          }
          .summary-label {
            font-weight: bold;
            min-width: 140px;
            margin-right: 8px;
            font-size: 8px;
          }
          .summary-value {
            flex: 1;
            border-bottom: 1px solid #000;
            padding-bottom: 1px;
            font-size: 8px;
          }
          .shipping-mark {
            margin-top: 10px;
            grid-column: 1 / -1;
          }
          .shipping-mark-content {
            border: 1px solid #000;
            padding: 8px;
            min-height: 40px;
            white-space: pre-wrap;
            background-color: #f9f9f9;
            font-size: 8px;
          }
          .footer {
            margin-top: 15px;
            text-align: center;
            font-size: 8px;
            color: #666;
          }
          @media print {
            body { 
              margin: 0; 
              font-size: 9px;
            }
            .no-print { display: none; }
            .header h1 { font-size: 16px; }
            .company-title { font-size: 10px; }
            .company-info { font-size: 8px; }
            .shipping-title { font-size: 10px; }
            .summary-title { font-size: 11px; }
            .table th { font-size: 7px; }
            .table td { font-size: 6px; }
            .table tfoot td { font-size: 7px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PACKING LIST</h1>
        </div>

        <div class="company-section">
          <div class="company-box">
            <div class="company-title">CONSIGNEE:</div>
            <div class="company-info">
              ${data.consignee}<br>
              ${data.consigneeAddress ? data.consigneeAddress.replace(/\n/g, '<br>') + '<br>' : ''}
              ${data.consigneePhone ? 'Tel: ' + data.consigneePhone + '<br>' : ''}
              ${data.consigneeEmail ? 'Email: ' + data.consigneeEmail + '<br>' : ''}
              ${data.consigneeContract ? 'Contract: ' + data.consigneeContract : ''}
            </div>
          </div>
          <div class="company-box">
            <div class="company-title">CONSIGNER:</div>
            <div class="company-info">
              ${data.consigner}<br>
              ${data.consignerAddress ? data.consignerAddress.replace(/\n/g, '<br>') + '<br>' : ''}
              ${data.consignerPhone ? 'Tel: ' + data.consignerPhone + '<br>' : ''}
              ${data.consignerEmail ? 'Email: ' + data.consignerEmail + '<br>' : ''}
              ${data.consignerContract ? 'Contract: ' + data.consignerContract : ''}
            </div>
          </div>
          <div class="company-box">
            <div class="company-title">SHIPPED TO:</div>
            <div class="company-info">
              ${data.shippedTo}<br>
              ${data.shippedToAddress ? data.shippedToAddress.replace(/\n/g, '<br>') + '<br>' : ''}
              ${data.shippedToPhone ? 'Tel: ' + data.shippedToPhone + '<br>' : ''}
              ${data.shippedToEmail ? 'Email: ' + data.shippedToEmail + '<br>' : ''}
              ${data.shippedToContract ? 'Contract: ' + data.shippedToContract : ''}
            </div>
          </div>
        </div>

        <div class="shipping-details">
          <div class="shipping-title">SHIPPING DETAILS</div>
          <div class="shipping-grid">
            <div>
              <div class="shipping-item">
                <span class="shipping-label">Customer OP No:</span>
                <span class="shipping-value">${data.customerOpNo}</span>
              </div>
              <div class="shipping-item">
                <span class="shipping-label">Port of Loading:</span>
                <span class="shipping-value">${data.portLoading}</span>
              </div>
            </div>
            <div>
              <div class="shipping-item">
                <span class="shipping-label">Type of Shipment:</span>
                <span class="shipping-value">${data.typeOfShipment}</span>
              </div>
              <div class="shipping-item">
                <span class="shipping-label">Port of Destination:</span>
                <span class="shipping-value">${data.portDestination}</span>
              </div>
            </div>
          </div>
        </div>

        

        <table class="table">
          <thead>
            <tr>
              <th>Pallet</th>
              <th>Box No.</th>
              <th>Net Wt/Box (g)</th>
              <th>Net Wt (g)</th>
              <th>Gross Wt (g)</th>
              <th>Product Code</th>
              <th>Description</th>
              <th>Batch</th>
            </tr>
          </thead>
                      <tbody>
              ${data.pallets
                .map((pallet, palletIndex) => {
                  // Generate rows for each product, including mixed products
                  const rows: string[] = [];
                  
                  pallet.products.forEach((product, productIndex) => {
                    // Main product row
                    const isFirstProduct = productIndex === 0;
                    const productNetWeight = product.quantity * product.weightPerBox;
                    
                    rows.push(`
                      <tr>
                        <td>${isFirstProduct ? palletIndex + 1 : ''}</td>
                        <td>${isFirstProduct ? `${pallet.boxNumberFrom}-${pallet.boxNumberTo}` : ''}</td>
                        <td>${product.weightPerBox}</td>
                        <td>${productNetWeight.toFixed(1)}</td>
                        <td>${product.totalGrossWeight.toFixed(1)}</td>
                        <td>${product.productCode || ''}</td>
                        <td>${product.description || ''}</td>
                        <td>${product.batch || ''} (${product.quantity} boxes)${product.hasMixedProducts ? ' + Mixed' : ''}</td>
                      </tr>
                    `);

                    // Second product row (if mixed products)
                    if (product.hasMixedProducts && product.secondProduct) {
                      const secondProductNetWeight = product.quantity * product.secondProduct.weightPerBox;
                      rows.push(`
                        <tr style="background-color: #f8f9fa;">
                          <td></td>
                          <td></td>
                          <td>${product.secondProduct.weightPerBox}</td>
                          <td>${secondProductNetWeight.toFixed(1)}</td>
                          <td>${product.secondProduct.totalGrossWeight.toFixed(1)}</td>
                          <td>${product.secondProduct.productCode || ''}</td>
                          <td>${product.secondProduct.description || ''}</td>
                          <td>${product.secondProduct.batch || ''} (2nd in same box)</td>
                        </tr>
                      `);
                    }
                  });
                  
                  return rows.join('');
                })
                .join("")}
            </tbody>
            <tfoot>
              <tr style="background-color: #f0f0f0; font-weight: bold;">
                <td colspan="2">TOTAL</td>
                <td>-</td>
                <td>${data.pallets.reduce((totalNet, pallet) => {
                  return totalNet + pallet.products.reduce((sum, product) => {
                    let productNet = product.quantity * product.weightPerBox;
                    // Add second product net weight if mixed
                    if (product.hasMixedProducts && product.secondProduct) {
                      productNet += product.quantity * product.secondProduct.weightPerBox;
                    }
                    return sum + productNet;
                  }, 0);
                }, 0).toFixed(1)}</td>
                <td>${data.pallets.reduce((totalGross, pallet) => {
                  return totalGross + pallet.products.reduce((sum, product) => {
                    let productGross = product.totalGrossWeight;
                    // Add second product gross weight if mixed
                    if (product.hasMixedProducts && product.secondProduct) {
                      productGross += product.secondProduct.totalGrossWeight;
                    }
                    return sum + productGross;
                  }, 0);
                }, 0).toFixed(1)}</td>
                <td colspan="3">-</td>
              </tr>
            </tfoot>
        </table>

        <div class="summary-section">
          <div class="summary-title">SUMMARY</div>
          <div class="summary-grid">
                          <div>
                <div class="summary-item">
                  <span class="summary-label">Box size:</span>
                  <span class="summary-value">${data.boxSize || '1-' + totals.totalBoxes}</span>
                </div>
              <div class="summary-item">
                <span class="summary-label">Box no:</span>
                <span class="summary-value">1-${totals.totalBoxes}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Total boxes/pallets:</span>
                <span class="summary-value">${totals.totalBoxes}/${totals.totalPallets}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Total gross weight:</span>
                <span class="summary-value">${totals.totalNetWeight.toFixed(1)} g</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Total gross weights (Pallet Include):</span>
                <span class="summary-value">${data.totalGrossWeight.toFixed(1)} g</span>
              </div>
            </div>
            <div>
              <div class="summary-item">
                <span class="summary-label">Airport:</span>
                <span class="summary-value">${data.airport}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Destination:</span>
                <span class="summary-value">${data.destination}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Pallet no:</span>
                <span class="summary-value">1-${totals.totalPallets}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Gross weight (รวมพาเลท):</span>
                <span class="summary-value">${data.totalGrossWeight.toFixed(1)} g</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Country of Origin:</span>
                <span class="summary-value">${data.countryOfOrigin}</span>
              </div>
            </div>

            <div class="shipping-mark">
              <div class="summary-item">
                <span class="summary-label">Shipping Mark:</span>
              </div>
              <div class="shipping-mark-content">${data.shippingMark}</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Generated on: ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        <div class="no-print" style="margin-top: 20px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Print PDF</button>
          <button onclick="window.close()" style="padding: 10px 20px; font-size: 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">Close</button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Auto-focus the print window
    printWindow.focus();
    
    toast.success('PDF window opened successfully!');
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error('Failed to generate PDF');
  }
}
