import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { api, money, user } from './api'
import logoXoxo from './assets/logo-xoxo.png'
import './styles.css'

const emptyProduct = {
  name: '',
  category: 'Cerveza',
  price: '',
  costPrice: '',
  stock: '',
  lowStockAlert: '5',
  active: true
}

const emptyUser = {
  username: '',
  password: '',
  role: 'CASHIER'
}

function BrandLogo({ compact = false }) {
  return (
    <div className={compact ? 'brand-logo compact' : 'brand-logo'}>
      <img src={logoXoxo} alt="Las Promos de Xoxo" />

      {!compact && (
        <div>
          <b>Las Promos de Xoxo</b>
        </div>
      )}
    </div>
  )
}

function Login({ onLogin }) {
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const login = async () => {
    try {
      setError('')
      setLoading(true)

      const response = await api.post('/auth/login', {
        username,
        password
      })

      localStorage.setItem('xoxo_token', response.data.token)
      localStorage.setItem('xoxo_user', JSON.stringify(response.data))

      onLogin()
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <div className="login-card branded-card">
        <img className="login-logo" src={logoXoxo} alt="Las Promos de Xoxo" />

        <h1>Las Promos de Xoxo</h1>

        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Usuario"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          onKeyDown={(e) => {
            if (e.key === 'Enter') login()
          }}
        />

        <button onClick={login} disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        {error && <div className="error">{error}</div>}

        <small>admin/admin123 · caja/caja123</small>
      </div>
    </div>
  )
}

function App() {
  const [logged, setLogged] = useState(!!localStorage.getItem('xoxo_token'))
  const [view, setView] = useState('pos')

  const [tables, setTables] = useState([])
  const [products, setProducts] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [accounts, setAccounts] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [tableAccounts, setTableAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [report, setReport] = useState(null)
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)

  const currentUser = user()
  const isAdmin = currentUser.role === 'ADMIN'

  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']") || document.createElement('link')
    link.rel = 'icon'
    link.href = logoXoxo
    document.head.appendChild(link)
  }, [])

  const handleError = (e) => {
    setError(e.response?.data?.message || e.message || 'Error inesperado')
  }

  const openPrompt = ({ title, message, placeholder, defaultValue = '', onConfirm }) => {
    setModal({
      type: 'prompt',
      title,
      message,
      placeholder,
      value: defaultValue,
      onConfirm
    })
  }

  const openConfirm = ({ title, message, onConfirm }) => {
    setModal({
      type: 'confirm',
      title,
      message,
      onConfirm
    })
  }

  const load = async () => {
    const calls = [
      api.get('/tables'),
      api.get('/products'),
      api.get('/products/all'),
      api.get('/accounts/open'),
      api.get('/reports/daily')
    ]

    if (isAdmin) {
      calls.push(api.get('/users'))
    }

    const responses = await Promise.all(calls)

    setTables(responses[0].data)
    setProducts(responses[1].data)
    setAllProducts(responses[2].data)
    setAccounts(responses[3].data)
    setReport(responses[4].data)

    if (responses[5]) {
      setUsers(responses[5].data)
    }
  }

  const loadTableAccounts = async (table) => {
    setSelectedTable(table)

    const response = await api.get(`/accounts/table/${table.id}/open`)
    setTableAccounts(response.data)

    if (response.data.length && !selectedAccount) {
      setSelectedAccount(response.data[0])
    }
  }

  useEffect(() => {
    if (logged) {
      load().catch(handleError)
    }
  }, [logged])

  if (!logged) {
    return <Login onLogin={() => setLogged(true)} />
  }

  const logout = () => {
    localStorage.removeItem('xoxo_token')
    localStorage.removeItem('xoxo_user')
    setLogged(false)
  }

  const nav = [
    ['pos', 'Mesas / cuentas'],
    ['products', 'Productos'],
    ['inventory', 'Inventario'],
    ['expenses', 'Gastos'],
    ['report', 'Reportes'],
    ...(isAdmin ? [['users', 'Usuarios']] : [])
  ]

  return (
    <div className="layout">
      <aside>
        <BrandLogo />

        <small className="user-badge">{currentUser.username} · {currentUser.role}</small>

        <nav>
          {nav.map(([key, label]) => (
            <button
              key={key}
              className={view === key ? 'active' : ''}
              onClick={() => setView(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="mini-report">
          <span>Utilidad estimada</span>
          <b>{money(report?.estimatedNetProfit)}</b>
          <small>Venta: {money(report?.salesTotal)}</small>
          <small>Margen: {report?.grossMarginPercent || 0}%</small>
        </div>

        <button className="logout" onClick={logout}>Salir</button>
      </aside>

      <main>
        <header className="app-header">
          <div className="header-brand">
            <BrandLogo compact />
            <div>
              <h1>Las Promos de Xoxo</h1>
            </div>
          </div>

          <button onClick={() => load().catch(handleError)}>Actualizar</button>
        </header>

        {error && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <div className="modal-icon danger-icon">⚠️</div>
              <h2>Algo pasó bro</h2>
              <p>{error}</p>
              <div className="modal-actions single">
                <button onClick={() => setError('')}>Entendido</button>
              </div>
            </div>
          </div>
        )}

        {view === 'pos' && (
          <POS
            tables={tables}
            products={products}
            accounts={accounts}
            selectedTable={selectedTable}
            tableAccounts={tableAccounts}
            selectedAccount={selectedAccount}
            setSelectedAccount={setSelectedAccount}
            load={load}
            loadTableAccounts={loadTableAccounts}
            onError={handleError}
            openPrompt={openPrompt}
            openConfirm={openConfirm}
          />
        )}

        {view === 'products' && (
          <Products products={allProducts} load={load} onError={handleError} />
        )}

        {view === 'inventory' && (
          <Inventory products={allProducts} load={load} onError={handleError} openPrompt={openPrompt} />
        )}

        {view === 'expenses' && (
          <Expenses load={load} onError={handleError} />
        )}

        {view === 'report' && (
          <Report report={report} />
        )}

        {view === 'users' && isAdmin && (
          <Users users={users} load={load} onError={handleError} />
        )}
      </main>

      <AppModal modal={modal} setModal={setModal} onError={handleError} />
    </div>
  )
}

function POS({
  tables,
  products,
  accounts,
  selectedTable,
  tableAccounts,
  selectedAccount,
  setSelectedAccount,
  load,
  loadTableAccounts,
  onError,
  openPrompt,
  openConfirm
}) {
  const accountsForTable = (tableId) => accounts.filter((a) => a.barTable?.id === tableId)
  const categories = [...new Set(products.map((p) => p.category || 'General'))]

  const createAccount = async () => {
    try {
      if (!selectedTable) {
        throw new Error('Selecciona una mesa primero')
      }

      openPrompt({
        title: 'Nueva cuenta',
        message: `¿A nombre de quién va la cuenta en ${selectedTable.name}?`,
        placeholder: 'Ej. Juan, Pedro, General, Pareja',
        defaultValue: 'Cliente ' + (tableAccounts.length + 1),
        onConfirm: async (name) => {
          const response = await api.post('/accounts', {
            tableId: selectedTable.id,
            customerName: name,
            notes: ''
          })

          setSelectedAccount(response.data)
          await load()
          await loadTableAccounts(selectedTable)
        }
      })
    } catch (e) {
      onError(e)
    }
  }

  const addItem = async (product) => {
    try {
      if (!selectedAccount) {
        throw new Error('Selecciona o crea una cuenta primero')
      }

      const response = await api.post(`/accounts/${selectedAccount.id}/items`, {
        productId: product.id,
        quantity: 1
      })

      setSelectedAccount(response.data)
      await load()
      await loadTableAccounts(selectedTable)
    } catch (e) {
      onError(e)
    }
  }

  const removeItem = async (itemId) => {
    try {
      const response = await api.delete(`/accounts/${selectedAccount.id}/items/${itemId}`)

      setSelectedAccount(response.data)
      await load()
      await loadTableAccounts(selectedTable)
    } catch (e) {
      onError(e)
    }
  }

  const pay = async (method) => {
    try {
      await api.post(`/accounts/${selectedAccount.id}/pay`, {
        paymentMethod: method
      })

      setSelectedAccount(null)
      await load()
      await loadTableAccounts(selectedTable)
    } catch (e) {
      onError(e)
    }
  }

  const cancel = async () => {
    try {
      if (!selectedAccount) return

      openConfirm({
        title: 'Cancelar cuenta',
        message: `¿Seguro que quieres cancelar la cuenta de ${selectedAccount.customerName}? Se regresará el stock de los productos.`,
        onConfirm: async () => {
          await api.post(`/accounts/${selectedAccount.id}/cancel`)

          setSelectedAccount(null)
          await load()
          await loadTableAccounts(selectedTable)
        }
      })
    } catch (e) {
      onError(e)
    }
  }

  const mergeAll = async () => {
    try {
      if (tableAccounts.length < 2) {
        throw new Error('Necesitas mínimo 2 cuentas para juntarlas')
      }

      openPrompt({
        title: 'Juntar cuentas',
        message: `Se juntarán ${tableAccounts.length} cuentas de ${selectedTable.name}. Ponle nombre a la cuenta unificada.`,
        placeholder: 'Ej. Cuenta junta, Mesa completa, Amigos',
        defaultValue: 'Cuenta junta',
        onConfirm: async (name) => {
          const response = await api.post('/accounts/merge', {
            accountIds: tableAccounts.map((a) => a.id),
            customerName: name
          })

          setSelectedAccount(response.data)
          await load()
          await loadTableAccounts(selectedTable)
        }
      })
    } catch (e) {
      onError(e)
    }
  }

  return (
    <div className="pos-grid">
      <section>
        <h2>Mesas</h2>

        <div className="tables">
          {tables.map((table) => {
            const totalAccounts = accountsForTable(table.id).length

            return (
              <button
                className={`table ${totalAccounts ? 'busy' : ''}`}
                key={table.id}
                onClick={() => loadTableAccounts(table)}
              >
                <b>{table.name}</b>
                <small>{totalAccounts ? `${totalAccounts} cuenta(s)` : 'Libre'}</small>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <div className="title-row">
          <h2>{selectedTable ? selectedTable.name : 'Selecciona mesa'}</h2>

          {selectedTable && (
            <button onClick={createAccount}>+ Nueva cuenta</button>
          )}
        </div>

        {selectedTable && (
          <>
            <div className="account-tabs">
              {tableAccounts.map((account) => (
                <button
                  key={account.id}
                  className={selectedAccount?.id === account.id ? 'active' : ''}
                  onClick={() => setSelectedAccount(account)}
                >
                  {account.customerName}
                  <small>{money(account.total)}</small>
                </button>
              ))}
            </div>

            {tableAccounts.length > 1 && (
              <button className="merge" onClick={mergeAll}>
                Juntar cuentas
              </button>
            )}
          </>
        )}

        <h2>Productos</h2>

        {categories.map((category) => (
          <div key={category}>
            <h3 className="cat">{category}</h3>

            <div className="products">
              {products
                .filter((p) => (p.category || 'General') === category)
                .map((product) => (
                  <button
                    className="product"
                    key={product.id}
                    onClick={() => addItem(product)}
                  >
                    <b>{product.name}</b>
                    <span>{money(product.price)}</span>
                    <small>Stock: {product.stock ?? 'N/A'}</small>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </section>

      <section className="ticket">
        <h2>Cuenta</h2>

        {!selectedAccount && <p>Crea o selecciona una cuenta.</p>}

        {selectedAccount && (
          <>
            <h3>{selectedAccount.customerName}</h3>
            <small>{selectedAccount.barTable?.name} · Cuenta #{selectedAccount.id}</small>

            <div className="items">
              {(selectedAccount.items || []).map((item) => (
                <div className="item" key={item.id}>
                  <div>
                    <b>{item.quantity} x {item.product?.name}</b>
                    <small>{money(item.unitPrice)} c/u</small>
                  </div>

                  <div>
                    <b>{money(item.subtotal)}</b>
                    <button
                      className="mini danger"
                      onClick={() => removeItem(item.id)}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="total">Total {money(selectedAccount.total)}</div>
            <div className="profit-line">Utilidad: {money(selectedAccount.grossProfit)}</div>

            <div className="pay-buttons">
              <button onClick={() => pay('CASH')}>Efectivo</button>
              <button onClick={() => pay('CARD')}>Tarjeta</button>
              <button onClick={() => pay('TRANSFER')}>Transferencia</button>
            </div>

            <button className="danger full" onClick={cancel}>
              Cancelar cuenta
            </button>
          </>
        )}
      </section>
    </div>
  )
}

function Products({ products, load, onError }) {
  const [form, setForm] = useState(emptyProduct)
  const [editing, setEditing] = useState(null)

  const save = async () => {
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        costPrice: form.costPrice === '' ? 0 : Number(form.costPrice),
        stock: form.stock === '' ? null : Number(form.stock),
        lowStockAlert: form.lowStockAlert === '' ? null : Number(form.lowStockAlert),
        active: form.active !== false
      }

      if (editing) {
        await api.put(`/products/${editing}`, payload)
      } else {
        await api.post('/products', payload)
      }

      setForm(emptyProduct)
      setEditing(null)
      await load()
    } catch (e) {
      onError(e)
    }
  }

  const edit = (product) => {
    setEditing(product.id)
    setForm({
      ...product,
      price: String(product.price),
      costPrice: String(product.costPrice || 0),
      stock: product.stock ?? '',
      lowStockAlert: product.lowStockAlert ?? ''
    })
  }

  const toggle = async (product) => {
    try {
      await api.patch(`/products/${product.id}/toggle`)
      await load()
    } catch (e) {
      onError(e)
    }
  }

  return (
    <div className="management">
      <section>
        <h2>{editing ? 'Editar producto' : 'Alta producto'}</h2>

        <div className="form">
          <input placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input placeholder="Categoría" value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input placeholder="Precio venta" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input placeholder="Costo producto" type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
          <input placeholder="Stock" type="number" value={form.stock ?? ''} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          <input placeholder="Alerta stock bajo" type="number" value={form.lowStockAlert ?? ''} onChange={(e) => setForm({ ...form, lowStockAlert: e.target.value })} />

          <label className="checkbox-label">
            <input type="checkbox" checked={form.active !== false} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Activo
          </label>

          <button onClick={save}>{editing ? 'Guardar' : 'Crear'}</button>

          {editing && (
            <button className="secondary" onClick={() => { setEditing(null); setForm(emptyProduct) }}>
              Cancelar
            </button>
          )}
        </div>
      </section>

      <section>
        <h2>Productos</h2>

        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Precio</th>
              <th>Costo</th>
              <th>Utilidad/u</th>
              <th>Stock</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                className={
                  !product.active
                    ? 'off'
                    : product.stock !== null &&
                      product.lowStockAlert !== null &&
                      product.stock <= product.lowStockAlert
                      ? 'low'
                      : ''
                }
              >
                <td>{product.name}<small>{product.category}</small></td>
                <td>{money(product.price)}</td>
                <td>{money(product.costPrice)}</td>
                <td>{money(Number(product.price) - Number(product.costPrice || 0))}</td>
                <td>{product.stock ?? 'N/A'}</td>
                <td>
                  <button className="mini" onClick={() => edit(product)}>Editar</button>{' '}
                  <button className="mini danger" onClick={() => toggle(product)}>
                    {product.active ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function Inventory({ products, load, onError, openPrompt }) {
  const updateStock = async (product) => {
    try {
      openPrompt({
        title: 'Ajustar stock',
        message: `Nuevo stock para ${product.name}`,
        placeholder: 'Cantidad disponible',
        defaultValue: String(product.stock ?? 0),
        onConfirm: async (value) => {
          await api.patch(`/products/${product.id}/stock?stock=${Number(value)}`)
          await load()
        }
      })
    } catch (e) {
      onError(e)
    }
  }

  return (
    <section>
      <h2>Inventario y alertas</h2>

      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Stock</th>
            <th>Alerta</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <tr key={product.id} className={!product.active ? 'off' : product.stock !== null && product.lowStockAlert !== null && product.stock <= product.lowStockAlert ? 'low' : ''}>
              <td>{product.name}</td>
              <td>{product.category}</td>
              <td>{product.stock ?? 'N/A'}</td>
              <td>{product.lowStockAlert ?? '-'}</td>
              <td><button className="mini" onClick={() => updateStock(product)}>Ajustar</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function Expenses({ load, onError }) {
  const [expenses, setExpenses] = useState([])
  const [concept, setConcept] = useState('')
  const [amount, setAmount] = useState('')

  const loadExpenses = async () => {
    const response = await api.get('/expenses/today')
    setExpenses(response.data)
  }

  useEffect(() => {
    loadExpenses().catch(onError)
  }, [])

  const save = async () => {
    try {
      await api.post('/expenses', { concept, amount: Number(amount), notes: '' })

      setConcept('')
      setAmount('')
      await loadExpenses()
      await load()
    } catch (e) {
      onError(e)
    }
  }

  const remove = async (id) => {
    try {
      await api.delete(`/expenses/${id}`)
      await loadExpenses()
      await load()
    } catch (e) {
      onError(e)
    }
  }

  return (
    <div className="management">
      <section>
        <h2>Registrar gasto</h2>
        <div className="form">
          <input placeholder="Concepto" value={concept} onChange={(e) => setConcept(e.target.value)} />
          <input placeholder="Monto" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <button onClick={save}>Guardar</button>
        </div>
      </section>

      <section>
        <h2>Gastos de hoy</h2>
        {expenses.map((expense) => (
          <div className="line" key={expense.id}>
            <b>{expense.concept}</b>
            <span>{money(expense.amount)}</span>
            <button className="mini danger" onClick={() => remove(expense.id)}>Eliminar</button>
          </div>
        ))}
      </section>
    </div>
  )
}

function Users({ users, load, onError }) {
  const [form, setForm] = useState(emptyUser)
  const [editing, setEditing] = useState(null)

  const save = async () => {
    try {
      if (editing) {
        await api.put(`/users/${editing}`, form)
      } else {
        await api.post('/users', form)
      }

      setForm(emptyUser)
      setEditing(null)
      await load()
    } catch (e) {
      onError(e)
    }
  }

  const edit = (selectedUser) => {
    setEditing(selectedUser.id)
    setForm({
      username: selectedUser.username,
      password: '',
      role: selectedUser.role,
      active: selectedUser.active
    })
  }

  const toggle = async (selectedUser) => {
    try {
      await api.patch(`/users/${selectedUser.id}/toggle`)
      await load()
    } catch (e) {
      onError(e)
    }
  }

  return (
    <div className="management">
      <section>
        <h2>{editing ? 'Editar usuario' : 'Nuevo usuario'}</h2>

        <div className="form">
          <input placeholder="Usuario" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input placeholder={editing ? 'Password opcional' : 'Password'} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />

          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="CASHIER">Cajero</option>
            <option value="ADMIN">Admin</option>
          </select>

          {editing && (
            <label className="checkbox-label">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Activo
            </label>
          )}

          <button onClick={save}>Guardar</button>

          {editing && (
            <button className="secondary" onClick={() => { setEditing(null); setForm(emptyUser) }}>
              Cancelar
            </button>
          )}
        </div>
      </section>

      <section>
        <h2>Usuarios</h2>

        <table>
          <tbody>
            {users.map((selectedUser) => (
              <tr key={selectedUser.id} className={!selectedUser.active ? 'off' : ''}>
                <td>{selectedUser.username}</td>
                <td>{selectedUser.role}</td>
                <td>{selectedUser.active ? 'Activo' : 'Inactivo'}</td>
                <td>
                  <button className="mini" onClick={() => edit(selectedUser)}>Editar</button>{' '}
                  <button className="mini danger" onClick={() => toggle(selectedUser)}>
                    {selectedUser.active ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function Report({ report }) {
  if (!report) return <p>Cargando...</p>

  return (
    <div className="report-page">
      <div className="kpis">
        <div><span>Ventas</span><b>{money(report.salesTotal)}</b></div>
        <div><span>Costo producto</span><b>{money(report.productCostTotal)}</b></div>
        <div><span>Utilidad bruta</span><b>{money(report.grossProfitTotal)}</b></div>
        <div><span>Utilidad neta est.</span><b>{money(report.estimatedNetProfit)}</b></div>
        <div><span>Gastos</span><b>{money(report.expensesTotal)}</b></div>
        <div><span>Margen</span><b>{report.grossMarginPercent}%</b></div>
        <div><span>Pagadas</span><b>{report.paidAccounts}</b></div>
        <div><span>Abiertas</span><b>{report.openAccounts}</b></div>
      </div>

      <section>
        <h2>Ventas por método</h2>
        {Object.entries(report.salesByPayment || {}).map(([method, value]) => (
          <div className="line" key={method}>
            <b>{method}</b>
            <span>{money(value)}</span>
          </div>
        ))}
      </section>

      <section>
        <h2>Utilidad por producto</h2>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Venta</th>
              <th>Costo</th>
              <th>Utilidad</th>
            </tr>
          </thead>

          <tbody>
            {(report.productSales || []).map((product) => (
              <tr key={product.productId}>
                <td>{product.productName}<small>{product.category}</small></td>
                <td>{product.quantity}</td>
                <td>{money(product.salesTotal)}</td>
                <td>{money(product.costTotal)}</td>
                <td>{money(product.grossProfit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Stock bajo</h2>
        {(report.lowStockProducts || []).map((product) => (
          <div className="line low" key={product.id}>
            <b>{product.name}</b>
            <span>{product.stock} restantes</span>
          </div>
        ))}
      </section>

      <section>
        <h2>Cuentas del día</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Mesa</th>
              <th>Cliente</th>
              <th>Status</th>
              <th>Venta</th>
              <th>Utilidad</th>
            </tr>
          </thead>

          <tbody>
            {(report.accounts || []).map((account) => (
              <tr key={account.id}>
                <td>{account.id}</td>
                <td>{account.barTable?.name}</td>
                <td>{account.customerName}</td>
                <td>{account.status}</td>
                <td>{money(account.total)}</td>
                <td>{money(account.grossProfit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function AppModal({ modal, setModal, onError }) {
  const [value, setValue] = useState(modal?.value || '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setValue(modal?.value || '')
    setLoading(false)
  }, [modal])

  if (!modal) return null

  const close = () => {
    if (!loading) setModal(null)
  }

  const confirm = async () => {
    try {
      if (modal.type === 'prompt' && !value.trim()) return

      setLoading(true)
      await modal.onConfirm?.(modal.type === 'prompt' ? value.trim() : true)
      setModal(null)
    } catch (e) {
      onError(e)
      setModal(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-icon">
          {modal.type === 'confirm' ? '❓' : '🧾'}
        </div>

        <h2>{modal.title}</h2>
        <p>{modal.message}</p>

        {modal.type === 'prompt' && (
          <input
            autoFocus
            value={value}
            placeholder={modal.placeholder}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') confirm()
              if (e.key === 'Escape') close()
            }}
          />
        )}

        <div className="modal-actions">
          <button className="secondary" onClick={close} disabled={loading}>
            Cancelar
          </button>

          <button onClick={confirm} disabled={loading}>
            {loading ? 'Guardando...' : modal.type === 'confirm' ? 'Sí, confirmar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
