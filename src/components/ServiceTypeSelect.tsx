import { useState, useEffect } from 'react'
import { useServiceTypes, useCreateServiceType } from '../hook/useServiceTypes'
import { useAuthContext } from '../context/authContext'


interface Props {
  value: string
  onChange: (value: string) => void
}

export function ServiceTypeSelect({ value, onChange }: Props) {
  const { user } = useAuthContext()
  const [isAdding, setIsAdding]   = useState(false)
  const [newName, setNewName]     = useState('')
  const [newDesc, setNewDesc]     = useState('')
  const [newBasePrice, setNewBasePrice] = useState('')
  const [newPricePerWeight, setNewPricePerWeight] = useState('')
  const [newPricePerPiece, setNewPricePerPiece] = useState('')
  const [addError, setAddError]   = useState('')
  

  const { data: serviceTypes, isLoading } = useServiceTypes()
  const createType = useCreateServiceType()

  const existingNames = serviceTypes?.map(st => st.name.toLowerCase()) || []  

  useEffect(() => {
  if (!value && serviceTypes && serviceTypes.length > 0) {
    onChange(serviceTypes[0].name);
  }
}, [serviceTypes, value, onChange]);

const handleAdd = () => {
    const trimmedName = newName.trim()
 
    if (!trimmedName) {
      setAddError('El nombre es requerido')
      return
    }
    if (trimmedName.length < 3) {
      setAddError('El nombre debe tener al menos 3 caracteres')
      return
    }
    if (existingNames.includes(trimmedName.toLowerCase())) {
      setAddError('Ya existe un tipo de servicio con ese nombre')
      return
    }
    setAddError('')
 
    createType.mutate(
      {
        name: trimmedName,
        description: newDesc.trim(),
        base_price: parseFloat(newBasePrice) || 0,
        price_per_weight: parseFloat(newPricePerWeight) || 0,
        price_per_piece: parseFloat(newPricePerPiece) || 0,
      },
      {
        onSuccess: (created) => {
          onChange(created.name) // seleccionar automáticamente el nuevo
          setNewName('')
          setNewDesc('')
          setNewBasePrice('')
          setNewPricePerWeight('')
          setNewPricePerPiece('')
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
console.log("serviceTypes:", serviceTypes);
console.log("value:", value);
  return (
    <div>
      {/* Selector principal */}
      {!isAdding && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={value}
            onChange={e => onChange(e.target.value)}
          >
            <option value="">Seleccione un servicio</option>
            {serviceTypes?.map(st => (
              <option key={st.id} value={st.name}>
                {st.name}
              </option>
            ))}
          </select>
          {}
          {user?.role === 'operator' && (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              style={styles.addBtn}
              title="Agregar nuevo tipo de servicio"
            >
              + Nuevo
            </button>
          )}
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

          <input
            style={styles.input}
            placeholder="Precio base"
            value={newBasePrice}
            onChange={e => setNewBasePrice(e.target.value)}
          />

          <input
            style={styles.input}
            placeholder="Precio por peso"
            value={newPricePerWeight}
            onChange={e => setNewPricePerWeight(e.target.value)}
          />

          <input
            style={styles.input}
            placeholder="Precio por pieza"
            value={newPricePerPiece}
            onChange={e => setNewPricePerPiece(e.target.value)}
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
          {serviceTypes?.find(st => st.name === value)?.description}
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