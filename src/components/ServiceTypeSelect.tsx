import { useState } from 'react'
import { useServiceTypes, useCreateServiceType } from '../hook/useServiceTypes'


interface Props {
  value: string
  onChange: (value: string) => void
}

export function ServiceTypeSelect({ value, onChange }: Props) {
  const [isAdding, setIsAdding]   = useState(false)
  const [newName, setNewName]     = useState('')
  const [newDesc, setNewDesc]     = useState('')
  const [addError, setAddError]   = useState('')

  const { data: serviceTypes, isLoading } = useServiceTypes()
  const createType = useCreateServiceType()

  const existingNames = serviceTypes?.map(st => st.Name.toLowerCase()) || []  

  const handleAdd = async () => {
    try {
      await createType.mutateAsync({ name: newName.trim(), description: newDesc.trim() })
      console.log('Nuevo tipo de servicio creado:', newName.trim())
    }
     
    catch (error) {
      console.error('Error al crear el tipo de servicio:', error)
    }
     
    if (!newName.trim()) {
      setAddError('El nombre es requerido')
    
      if (newName.trim().length < 3) {
        setAddError('El nombre debe tener al menos 3 caracteres')
      }

      if (existingNames.includes(newName.trim().toLowerCase())) {
        setAddError('Ya existe un tipo de servicio con ese nombre')
      }


      return
   
    }
    setAddError('')

    createType.mutate(
      { name: newName.trim(), description: newDesc.trim() },
      {
        onSuccess: (created) => {
          onChange(created.Name) // seleccionar automáticamente el nuevo
          setNewName('')
          setNewDesc('')
          setIsAdding(false)
        },
        onError: (err: unknown) => {
          const axiosErr = err as { response?: { data?: { error?: string } } }
          setAddError(axiosErr.response?.data?.error ?? 'Error al crear el servicio')
        },
      }
    )
  }

  if (isLoading) return <p style={{ color: '#888' }}>Cargando servicios...</p>

  return (
    <div>
      {/* Selector principal */}
      {!isAdding && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={value}
            onChange={e => onChange(e.target.value)}
          >
            {serviceTypes?.map(st => (
              <option key={st.ID} value={st.Name}>
                {st.Name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setIsAdding(true)}
            style={styles.addBtn}
            title="Agregar nuevo tipo de servicio"
          >
            + Nuevo
          </button>
        </div>
      )}

      {/* Formulario inline para agregar nuevo */}
      {isAdding && (
        <div className="add-service-type-box">
          <p style={styles.addTitle}>Nuevo tipo de servicio</p>

          <input
            style={styles.input}
            placeholder="Nombre del servicio (ej: Blanqueamiento)"
            value={newName}
          
            onChange={e => setNewName(e.target.value)}
            autoFocus
          />

          <input
            style={styles.input}
            placeholder="Descripción (opcional)"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
          />

          {addError && <p style={styles.error}>{addError}</p>}

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={handleAdd}
              disabled={createType.isPending}
              style={styles.confirmBtn}
            >
              {createType.isPending ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => { setIsAdding(false); setAddError(''); setNewName(''); setNewDesc('') }}
              style={styles.cancelBtn}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Mostrar descripción del tipo seleccionado */}
      {value && !isAdding && (
        <p style={styles.hint}>
          {serviceTypes?.find(st => st.Name === value)?.Description}
        </p>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  select: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  addBtn: {
    padding: '10px 16px',
    backgroundColor: '#1b4f72',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
    whiteSpace: 'nowrap',
  },
  addBox: {
    backgroundColor: '#f0f4f8',
    border: '1px dashed #2e86c1',
    borderRadius: '10px',
    padding: '16px',
  },
  addTitle: {
    margin: '0 0 12px 0',
    fontWeight: 700,
    fontSize: '14px',
    color: '#1b4f72',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    marginBottom: '8px',
    boxSizing: 'border-box',
  },
  error: {
    color: '#c0392b',
    fontSize: '13px',
    margin: '4px 0 0',
  },
  confirmBtn: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  cancelBtn: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#e0e0e0',
    color: '#333',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  hint: {
    fontSize: '12px',
    color: '#888',
    margin: '6px 0 0',
    fontStyle: 'italic',
  },
}

export default ServiceTypeSelect