import React, { useState } from 'react';
import { Table, Spin } from 'antd';
import styles from './ComparisonTable.module.css';

const ComparisonTable = ({ data, loading, onExport, filters }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  // Define columns based on your data structure and requirements
  // Example columns:
  const columns = [
    { title: 'CÓDIGO', dataIndex: 'CODIGO', key: 'CODIGO', sorter: (a, b) => a.CODIGO.localeCompare(b.CODIGO) },
    { title: 'DESCRIPCIÓN', dataIndex: 'DESCRIPCION', key: 'DESCRIPCION' },
    { title: 'STOCK SISTEMA', dataIndex: 'STOCK_SISTEMA', key: 'STOCK_SISTEMA', sorter: (a, b) => a.STOCK_SISTEMA - b.STOCK_SISTEMA },
    { title: 'STOCK REAL', dataIndex: 'STOCK_REAL', key: 'STOCK_REAL', sorter: (a, b) => a.STOCK_REAL - b.STOCK_REAL },
    { title: 'DIFERENCIA', dataIndex: 'DIFERENCIA', key: 'DIFERENCIA', 
      render: (text, record) => {
        if (record.SOBRANTE > 0) return <span style={{ color: 'green' }}>{`Sobrante: ${record.SOBRANTE}`}</span>;
        if (record.FALTANTE > 0) return <span style={{ color: 'red' }}>{`Faltante: ${record.FALTANTE}`}</span>;
        return 0;
      },
      sorter: (a, b) => (a.SOBRANTE || -a.FALTANTE) - (b.SOBRANTE || -b.FALTANTE) 
    },
    // Add more columns as needed, e.g., DESCRIPCION_ADICIONAL, SOBRANTE, FALTANTE
  ];

  // Apply filters if any (this is a basic example, expand as needed)
  const filteredData = data.filter(item => {
    if (filters && filters.codigo && !item.CODIGO.includes(filters.codigo)) {
      return false;
    }
    // Add more filter conditions here
    return true;
  });

  return (
    <div className={styles.comparisonTableContainer}>
      {onExport && <div style={{ marginBottom: 16 }}>{/* ExportButton will be placed here or passed by parent */}</div>}
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={filteredData} // Use data directly if filters are handled by Ant Design Table itself
          rowKey={(record) => record.CODIGO || record.DESCRIPCION || `item-${Math.random()}`}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            onChange: (page, newPageSize) => {
              setCurrentPage(page);
              // Check if newPageSize is provided (it might not be if only page number changes)
              if (newPageSize && newPageSize !== pageSize) {
                setPageSize(newPageSize);
                // Reset to page 1 if page size changes, to avoid being on an invalid page
                // setCurrentPage(1); // Optional: consider if this behavior is desired
              }
            },
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} ítems`,
          }}
          scroll={{ x: 'max-content' }} // For horizontal scrolling if many columns
          className={styles.table}
        />
      </Spin>
    </div>
  );
};

export default ComparisonTable;
