import React from 'react';
import { Form, Input, Button, Select, Space, Divider } from 'antd';
import { ComponenteReporte, TipoComponente } from '../../types/ReporteConfig';

const { Option } = Select;

interface Props {
  componente: ComponenteReporte;
  onGuardar: (componente: ComponenteReporte) => void;
  onCancelar: () => void;
}

/**
 * Componente para configurar un componente del reporte
 */
export const ConfiguracionComponente: React.FC<Props> = ({ 
  componente, 
  onGuardar, 
  onCancelar 
}) => {
  const [form] = Form.useForm();
  
  // Inicializar el formulario con los valores del componente
  React.useEffect(() => {
    form.setFieldsValue({
      titulo: componente.titulo,
      configuracion: componente.configuracion || {}
    });
  }, [componente, form]);
  
  // Manejar el envío del formulario
  const handleSubmit = (values: any) => {
    const componenteActualizado: ComponenteReporte = {
      ...componente,
      titulo: values.titulo,
      configuracion: values.configuracion
    };
    
    onGuardar(componenteActualizado);
  };
  
  // Renderizar campos de configuración específicos según el tipo de componente
  const renderCamposEspecificos = () => {
    switch (componente.tipo) {
      case TipoComponente.TOP_PRODUCTOS:
        return (
          <>
            <Form.Item
              name={['configuracion', 'numProductos']}
              label="Número de productos"
              initialValue={componente.configuracion?.numProductos || 10}
            >
              <Select>
                <Option value={5}>5</Option>
                <Option value={10}>10</Option>
                <Option value={20}>20</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name={['configuracion', 'mostrarCantidad']}
              label="Mostrar por"
              initialValue={componente.configuracion?.mostrarCantidad !== false}
            >
              <Select>
                <Option value={true}>Cantidad</Option>
                <Option value={false}>Importe</Option>
              </Select>
            </Form.Item>
          </>
        );
        
      case TipoComponente.TOP_CLIENTES:
        return (
          <>
            <Form.Item
              name={['configuracion', 'tipoCliente']}
              label="Tipo de cliente"
              initialValue={componente.configuracion?.tipoCliente || 'Distribuidores'}
            >
              <Select>
                <Option value="Distribuidores">Distribuidores</Option>
                <Option value="Minoristas">Minoristas</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name={['configuracion', 'numClientes']}
              label="Número de clientes"
              initialValue={componente.configuracion?.numClientes || 10}
            >
              <Select>
                <Option value={5}>5</Option>
                <Option value={10}>10</Option>
                <Option value={20}>20</Option>
              </Select>
            </Form.Item>
          </>
        );
        
      case TipoComponente.VENDEDORES:
        return (
          <>
            <Form.Item
              name={['configuracion', 'mesSeleccionado']}
              label="Mes"
              initialValue={componente.configuracion?.mesSeleccionado || 'Total'}
            >
              <Select>
                <Option value="Total">Total</Option>
                <Option value="Enero">Enero</Option>
                <Option value="Febrero">Febrero</Option>
                <Option value="Marzo">Marzo</Option>
                <Option value="Abril">Abril</Option>
                <Option value="Mayo">Mayo</Option>
                <Option value="Junio">Junio</Option>
                <Option value="Julio">Julio</Option>
                <Option value="Agosto">Agosto</Option>
                <Option value="Septiembre">Septiembre</Option>
                <Option value="Octubre">Octubre</Option>
                <Option value="Noviembre">Noviembre</Option>
                <Option value="Diciembre">Diciembre</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name={['configuracion', 'mostrarCantidad']}
              label="Mostrar por"
              initialValue={componente.configuracion?.mostrarCantidad !== false}
            >
              <Select>
                <Option value={true}>Cantidad</Option>
                <Option value={false}>Importe</Option>
              </Select>
            </Form.Item>
          </>
        );
        
      case TipoComponente.TABLA_TOP_PRODUCTOS:
      case TipoComponente.TABLA_TOP_CLIENTES:
        return (
          <Form.Item
            name={['configuracion', 'numItems']}
            label="Número de elementos"
            initialValue={componente.configuracion?.numItems || 10}
          >
            <Select>
              <Option value={5}>5</Option>
              <Option value={10}>10</Option>
              <Option value={20}>20</Option>
              <Option value={50}>50</Option>
            </Select>
          </Form.Item>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        titulo: componente.titulo,
        configuracion: componente.configuracion || {}
      }}
    >
      <Form.Item
        name="titulo"
        label="Título del componente"
        rules={[{ required: true, message: 'Por favor ingresa un título' }]}
      >
        <Input placeholder="Título del componente" />
      </Form.Item>
      
      <Divider>Configuración específica</Divider>
      
      {renderCamposEspecificos()}
      
      <Divider />
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <Space>
          <Button onClick={onCancelar}>
            Cancelar
          </Button>
          <Button type="primary" htmlType="submit">
            Guardar
          </Button>
        </Space>
      </div>
    </Form>
  );
};
