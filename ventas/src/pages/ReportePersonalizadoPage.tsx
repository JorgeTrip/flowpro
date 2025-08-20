import React, { useState, useRef, useEffect } from 'react';
import { 
  Layout, Typography, Button, Card, Tabs, Form, Input, Select, 
  Checkbox, List, Space, Modal, message, Tooltip, Divider, 
  DatePicker, Radio, Drawer, Spin
} from 'antd';
import {
  PlusOutlined, SaveOutlined, DeleteOutlined, ExportOutlined,
  ImportOutlined, EyeOutlined, FilePdfOutlined, EditOutlined,
  DragOutlined, SettingOutlined, CopyOutlined
} from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ReporteConfig, ComponenteReporte, TipoComponente } from '../types/ReporteConfig';
import ReporteConfigService from '../services/ReporteConfigService';
import PDFGeneratorService from '../services/PDFGeneratorService';
import { useVentas } from '../context/VentasContext';
import { ComponenteSelector } from '../components/ReportePersonalizado/ComponenteSelector';
import { ReportePreview } from '../components/ReportePersonalizado/ReportePreview';
import { ConfiguracionComponente } from '../components/ReportePersonalizado/ConfiguracionComponente';

const { Title, Text } = Typography;
const { Content } = Layout;
const { TabPane } = Tabs;
const { Option } = Select;

// Importamos el hook useVentas para obtener los datos de ventas
// Nota: Si no existe, deberás crearlo o adaptar esta parte

const ReportePersonalizadoPage: React.FC = () => {
  // Estado para las ventas
  const { ventas } = useVentas();
  const [cargando, setCargando] = useState<boolean>(false);
  
  // Estado para la configuración actual
  const [configActual, setConfigActual] = useState<ReporteConfig>({
    id: uuidv4(),
    nombre: 'Nuevo Reporte',
    fechaCreacion: new Date().toISOString(),
    componentes: [],
    mesesSeleccionados: [],
    mostrarImporte: true,
    mostrarCantidad: true
  });
  
  // Estado para las configuraciones guardadas
  const [configuracionesGuardadas, setConfiguracionesGuardadas] = useState<ReporteConfig[]>([]);
  
  // Estado para el componente seleccionado para editar
  const [componenteSeleccionado, setComponenteSeleccionado] = useState<ComponenteReporte | null>(null);
  
  // Estado para el drawer de configuración de componente
  const [drawerVisible, setDrawerVisible] = useState(false);
  
  // Estado para la vista previa del PDF
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>('');
  const [pdfPreviewVisible, setPdfPreviewVisible] = useState<boolean>(false);
  const [generandoPdf, setGenerandoPdf] = useState<boolean>(false);
  const [modoImpresion, setModoImpresion] = useState<boolean>(false);
  
  // Referencias a los elementos DOM para la generación del PDF
  const componentesRefs = useRef<Record<string, HTMLElement>>({});
  
  // Formulario para la configuración del reporte
  const [form] = Form.useForm();
  
  // Meses disponibles
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  // Cargar configuraciones guardadas al iniciar
  useEffect(() => {
    const configs = ReporteConfigService.obtenerConfiguraciones();
    setConfiguracionesGuardadas(configs);
  }, []);
  
  // Actualizar el formulario cuando cambia la configuración actual
  useEffect(() => {
    form.setFieldsValue({
      nombre: configActual.nombre,
      descripcion: configActual.descripcion,
      mesesSeleccionados: configActual.mesesSeleccionados,
      mostrarImporte: configActual.mostrarImporte,
      mostrarCantidad: configActual.mostrarCantidad
    });
  }, [configActual, form]);
  
  // Guardar la configuración actual
  const guardarConfiguracion = () => {
    // Validar que tenga un nombre
    if (!configActual.nombre.trim()) {
      message.error('El reporte debe tener un nombre');
      return;
    }
    
    // Validar que tenga al menos un componente
    if (configActual.componentes.length === 0) {
      message.error('El reporte debe tener al menos un componente');
      return;
    }
    
    // Guardar la configuración
    const exito = ReporteConfigService.guardarConfiguracion(configActual);
    
    if (exito) {
      message.success('Configuración guardada correctamente');
      
      // Actualizar la lista de configuraciones guardadas
      const configs = ReporteConfigService.obtenerConfiguraciones();
      setConfiguracionesGuardadas(configs);
    } else {
      message.error('Error al guardar la configuración');
    }
  };
  
  // Cargar una configuración guardada
  const cargarConfiguracion = (config: ReporteConfig) => {
    setConfigActual(config);
  };
  
  // Eliminar una configuración guardada
  const eliminarConfiguracion = (id: string) => {
    Modal.confirm({
      title: '¿Estás seguro de eliminar esta configuración?',
      content: 'Esta acción no se puede deshacer',
      okText: 'Sí, eliminar',
      okType: 'danger',
      cancelText: 'Cancelar',
      onOk() {
        const exito = ReporteConfigService.eliminarConfiguracion(id);
        
        if (exito) {
          message.success('Configuración eliminada correctamente');
          
          // Actualizar la lista de configuraciones guardadas
          const configs = ReporteConfigService.obtenerConfiguraciones();
          setConfiguracionesGuardadas(configs);
          
          // Si la configuración actual es la eliminada, crear una nueva
          if (configActual.id === id) {
            setConfigActual({
              id: uuidv4(),
              nombre: 'Nuevo Reporte',
              fechaCreacion: new Date().toISOString(),
              componentes: [],
              mesesSeleccionados: [],
              mostrarImporte: true,
              mostrarCantidad: true
            });
          }
        } else {
          message.error('Error al eliminar la configuración');
        }
      }
    });
  };
  
  // Exportar configuraciones
  const exportarConfiguraciones = () => {
    ReporteConfigService.exportarConfiguraciones();
  };
  
  // Importar configuraciones
  const importarConfiguraciones = () => {
    // Crear un input de tipo file oculto
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (file) {
        try {
          const exito = await ReporteConfigService.importarConfiguraciones(file);
          
          if (exito) {
            message.success('Configuraciones importadas correctamente');
            
            // Actualizar la lista de configuraciones guardadas
            const configs = ReporteConfigService.obtenerConfiguraciones();
            setConfiguracionesGuardadas(configs);
          } else {
            message.error('Error al importar las configuraciones');
          }
        } catch (error) {
          message.error('Error al procesar el archivo');
        }
      }
    };
    
    input.click();
  };
  
  // Agregar un nuevo componente
  const agregarComponente = (tipo: TipoComponente) => {
    const nuevoComponente: ComponenteReporte = {
      id: uuidv4(),
      tipo,
      titulo: obtenerTituloComponente(tipo),
      orden: configActual.componentes.length
    };
    
    setConfigActual({
      ...configActual,
      componentes: [...configActual.componentes, nuevoComponente]
    });
  };
  
  // Obtener el título por defecto para un tipo de componente
  const obtenerTituloComponente = (tipo: TipoComponente): string => {
    switch (tipo) {
      case TipoComponente.VENTAS_MENSUALES:
        return 'Ventas Mensuales';
      case TipoComponente.VENTAS_POR_RUBRO:
        return 'Ventas por Rubro';
      case TipoComponente.VENTAS_POR_ZONA:
        return 'Ventas por Zona';
      case TipoComponente.TOP_PRODUCTOS:
        return 'Top Productos';
      case TipoComponente.TOP_CLIENTES:
        return 'Top Clientes';
      case TipoComponente.VENDEDORES:
        return 'Vendedores';
      case TipoComponente.TABLA_RESUMEN_MENSUAL:
        return 'Tabla Resumen Mensual';
      case TipoComponente.TABLA_RUBRO:
        return 'Tabla por Rubro';
      case TipoComponente.TABLA_ZONA:
        return 'Tabla por Zona';
      case TipoComponente.TABLA_VENDEDOR:
        return 'Tabla por Vendedor';
      case TipoComponente.TABLA_TOP_PRODUCTOS:
        return 'Tabla Top Productos';
      case TipoComponente.TABLA_TOP_CLIENTES:
        return 'Tabla Top Clientes';
      default:
        return 'Componente';
    }
  };
  
  // Eliminar un componente
  const eliminarComponente = (id: string) => {
    setConfigActual({
      ...configActual,
      componentes: configActual.componentes.filter(c => c.id !== id)
    });
  };
  
  // Editar un componente
  const editarComponente = (componente: ComponenteReporte) => {
    setComponenteSeleccionado(componente);
    setDrawerVisible(true);
  };
  
  // Guardar cambios en un componente
  const guardarCambiosComponente = (componenteEditado: ComponenteReporte) => {
    setConfigActual({
      ...configActual,
      componentes: configActual.componentes.map(c => 
        c.id === componenteEditado.id ? componenteEditado : c
      )
    });
    
    setDrawerVisible(false);
    setComponenteSeleccionado(null);
  };
  
  // Reordenar componentes
  const reordenarComponentes = (componentesOrdenados: ComponenteReporte[]) => {
    // Actualizar el orden de los componentes
    const componentesConOrden = componentesOrdenados.map((c, index) => ({
      ...c,
      orden: index
    }));
    
    setConfigActual({
      ...configActual,
      componentes: componentesConOrden
    });
  };
  
  // Generar PDF
  const generarPDF = async () => {
    if (configActual.componentes.length === 0) {
      message.error('El reporte debe tener al menos un componente');
      return;
    }
    
    setGenerandoPdf(true);
    setModoImpresion(true);
    
    // Esperar a que el DOM se actualice con el modo impresión
    setTimeout(async () => {
      try {
        // Generar el PDF
        await PDFGeneratorService.generarPDF(
          configActual,
          ventas,
          componentesRefs.current
        );
        
        setGenerandoPdf(false);
        setModoImpresion(false);
        message.success('PDF generado correctamente');
      } catch (error) {
        setGenerandoPdf(false);
        setModoImpresion(false);
        message.error('Error al generar el PDF');
      }
    }, 500);
  };
  
  // Generar vista previa del PDF
  const generarVistaPreviaPDF = async () => {
    if (configActual.componentes.length === 0) {
      message.error('El reporte debe tener al menos un componente');
      return;
    }
    
    setGenerandoPdf(true);
    setModoImpresion(true);
    
    // Esperar a que el DOM se actualice con el modo impresión
    setTimeout(async () => {
      try {
        // Generar la vista previa del PDF
        const url = await PDFGeneratorService.generarVistaPreviaPDF(
          configActual,
          ventas,
          componentesRefs.current
        );
        
        setPdfPreviewUrl(url);
        setPdfPreviewVisible(true);
        setGenerandoPdf(false);
      } catch (error) {
        setGenerandoPdf(false);
        setModoImpresion(false);
        message.error('Error al generar la vista previa del PDF');
      }
    }, 500);
  };
  
  // Crear una nueva configuración
  const crearNuevaConfiguracion = () => {
    setConfigActual({
      id: uuidv4(),
      nombre: 'Nuevo Reporte',
      fechaCreacion: new Date().toISOString(),
      componentes: [],
      mesesSeleccionados: [],
      mostrarImporte: true,
      mostrarCantidad: true
    });
  };
  
  // Duplicar una configuración
  const duplicarConfiguracion = (config: ReporteConfig) => {
    const nuevaConfig = {
      ...config,
      id: uuidv4(),
      nombre: `${config.nombre} (copia)`,
      fechaCreacion: new Date().toISOString()
    };
    
    setConfigActual(nuevaConfig);
  };
  
  // Manejar cambios en el formulario
  const handleFormChange = (changedValues: any, allValues: any) => {
    setConfigActual({
      ...configActual,
      nombre: allValues.nombre,
      descripcion: allValues.descripcion,
      mesesSeleccionados: allValues.mesesSeleccionados || [],
      mostrarImporte: allValues.mostrarImporte,
      mostrarCantidad: allValues.mostrarCantidad
    });
  };
  
  // Registrar una referencia a un componente para el PDF
  const registrarRefComponente = (id: string, ref: HTMLElement | null) => {
    if (ref) {
      componentesRefs.current[id] = ref;
    }
  };
  
  return (
    <Layout>
      <Content style={{ padding: '0 50px', marginTop: 20 }}>
        <Card>
          <Title level={2}>Reportes Personalizados</Title>
          <Text>Crea, guarda y exporta reportes personalizados con los componentes que elijas.</Text>
          
          <Tabs defaultActiveKey="editor">
            <TabPane tab="Editor de Reportes" key="editor">
              <div style={{ display: 'flex', marginBottom: 16 }}>
                <div style={{ flex: 1, marginRight: 16 }}>
                  <Card title="Configuración del Reporte" size="small">
                    <Form
                      form={form}
                      layout="vertical"
                      onValuesChange={handleFormChange}
                      initialValues={{
                        nombre: configActual.nombre,
                        descripcion: configActual.descripcion,
                        mesesSeleccionados: configActual.mesesSeleccionados,
                        mostrarImporte: configActual.mostrarImporte,
                        mostrarCantidad: configActual.mostrarCantidad
                      }}
                    >
                      <Form.Item
                        name="nombre"
                        label="Nombre del Reporte"
                        rules={[{ required: true, message: 'Por favor ingresa un nombre' }]}
                      >
                        <Input placeholder="Nombre del reporte" />
                      </Form.Item>
                      
                      <Form.Item
                        name="descripcion"
                        label="Descripción"
                      >
                        <Input.TextArea placeholder="Descripción del reporte" rows={2} />
                      </Form.Item>
                      
                      <Form.Item
                        name="mesesSeleccionados"
                        label="Meses a incluir"
                      >
                        <Select
                          mode="multiple"
                          placeholder="Selecciona los meses (todos si no seleccionas ninguno)"
                          style={{ width: '100%' }}
                        >
                          {meses.map(mes => (
                            <Option key={mes} value={mes}>{mes}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                      
                      <Form.Item label="Datos a mostrar">
                        <Space>
                          <Form.Item name="mostrarImporte" valuePropName="checked" noStyle>
                            <Checkbox>Importe</Checkbox>
                          </Form.Item>
                          <Form.Item name="mostrarCantidad" valuePropName="checked" noStyle>
                            <Checkbox>Cantidad</Checkbox>
                          </Form.Item>
                        </Space>
                      </Form.Item>
                    </Form>
                  </Card>
                  
                  <Card title="Componentes Disponibles" size="small" style={{ marginTop: 16 }}>
                    <ComponenteSelector onSeleccionarComponente={agregarComponente} />
                  </Card>
                </div>
                
                <div style={{ flex: 2 }}>
                  <Card 
                    title="Vista Previa" 
                    size="small"
                    extra={
                      <Space>
                        <Button
                          icon={<FilePdfOutlined />}
                          onClick={generarPDF}
                          loading={generandoPdf}
                        >
                          Generar PDF
                        </Button>
                        <Button
                          icon={<EyeOutlined />}
                          onClick={generarVistaPreviaPDF}
                          loading={generandoPdf}
                        >
                          Vista Previa
                        </Button>
                      </Space>
                    }
                  >
                    <div style={{ minHeight: 500 }}>
                      <DndProvider backend={HTML5Backend}>
                        <ReportePreview
                          config={configActual}
                          ventas={ventas}
                          onReordenar={reordenarComponentes}
                          onEliminar={eliminarComponente}
                          onEditar={editarComponente}
                          registrarRef={registrarRefComponente}
                          isPrintMode={modoImpresion}
                        />
                      </DndProvider>
                    </div>
                  </Card>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                <Button 
                  type="default" 
                  icon={<PlusOutlined />} 
                  onClick={crearNuevaConfiguracion}
                >
                  Nuevo Reporte
                </Button>
                
                <Space>
                  <Button 
                    type="primary" 
                    icon={<SaveOutlined />} 
                    onClick={guardarConfiguracion}
                  >
                    Guardar Configuración
                  </Button>
                </Space>
              </div>
            </TabPane>
            
            <TabPane tab="Configuraciones Guardadas" key="guardadas">
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <Space>
                  <Button 
                    icon={<ExportOutlined />} 
                    onClick={exportarConfiguraciones}
                  >
                    Exportar Configuraciones
                  </Button>
                  <Button 
                    icon={<ImportOutlined />} 
                    onClick={importarConfiguraciones}
                  >
                    Importar Configuraciones
                  </Button>
                </Space>
              </div>
              
              <List
                grid={{ gutter: 16, column: 3 }}
                dataSource={configuracionesGuardadas}
                renderItem={item => (
                  <List.Item>
                    <Card
                      title={item.nombre}
                      size="small"
                      actions={[
                        <Tooltip title="Editar">
                          <EditOutlined key="edit" onClick={() => cargarConfiguracion(item)} />
                        </Tooltip>,
                        <Tooltip title="Duplicar">
                          <CopyOutlined key="copy" onClick={() => duplicarConfiguracion(item)} />
                        </Tooltip>,
                        <Tooltip title="Eliminar">
                          <DeleteOutlined key="delete" onClick={() => eliminarConfiguracion(item.id)} />
                        </Tooltip>,
                      ]}
                    >
                      <div style={{ height: 100, overflow: 'hidden' }}>
                        <p><Text type="secondary">Creado: {new Date(item.fechaCreacion).toLocaleDateString('es-AR')}</Text></p>
                        <p>{item.descripcion || 'Sin descripción'}</p>
                        <p><Text type="secondary">Componentes: {item.componentes.length}</Text></p>
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
            </TabPane>
          </Tabs>
        </Card>
        
        {/* Drawer para configurar un componente */}
        <Drawer
          title={`Configurar ${componenteSeleccionado?.titulo || 'Componente'}`}
          placement="right"
          width={500}
          onClose={() => setDrawerVisible(false)}
          visible={drawerVisible}
          destroyOnClose
        >
          {componenteSeleccionado && (
            <ConfiguracionComponente
              componente={componenteSeleccionado}
              onGuardar={guardarCambiosComponente}
              onCancelar={() => setDrawerVisible(false)}
            />
          )}
        </Drawer>
        
        {/* Modal para vista previa del PDF */}
        <Modal
          title="Vista Previa del PDF"
          visible={pdfPreviewVisible}
          onCancel={() => {
            setPdfPreviewVisible(false);
            URL.revokeObjectURL(pdfPreviewUrl);
          }}
          footer={[
            <Button 
              key="download" 
              type="primary" 
              icon={<FilePdfOutlined />} 
              onClick={generarPDF}
            >
              Descargar PDF
            </Button>,
            <Button 
              key="close" 
              onClick={() => {
                setPdfPreviewVisible(false);
                URL.revokeObjectURL(pdfPreviewUrl);
              }}
            >
              Cerrar
            </Button>
          ]}
          width={800}
        >
          {pdfPreviewUrl ? (
            <iframe
              src={pdfPreviewUrl}
              style={{ width: '100%', height: '70vh' }}
              title="Vista previa del PDF"
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <Spin />
              <p>Generando vista previa...</p>
            </div>
          )}
        </Modal>
      </Content>
    </Layout>
  );
};

export default ReportePersonalizadoPage;
