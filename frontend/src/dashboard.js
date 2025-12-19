// ===== CONFIGURAÇÕES E CONSTANTES =====
const API_URL = "http://127.0.0.1:5000"

// ===== VERIFICAÇÃO DE AUTENTICAÇÃO =====
const user = JSON.parse(localStorage.getItem("user"))

if (!user) {
  window.location.href = "/frontend/index.html"
}

// ===== CONTROLE DE PERMISSÕES =====
const permissions = {
  canCreate: ["manager", "admin"].includes(user.role),
  canEdit: ["manager", "admin"].includes(user.role),
  canDelete: user.role === "admin",
}

// ===== ELEMENTOS DO DOM =====
const elements = {
  userName: document.getElementById("userName"),
  userRole: document.getElementById("userRole"),
  logoutBtn: document.getElementById("logoutBtn"),

  // Estatísticas
  totalResources: document.getElementById("totalResources"),
  totalUsers: document.getElementById("totalUsers"),
  activeResources: document.getElementById("activeResources"),
  activityList: document.getElementById("activityList"),
  activityPeriodFilter: document.getElementById("activityPeriodFilter"), // Adiciona elemento para filtro de período

  // Formulário criar
  createSection: document.getElementById("createSection"),
  createForm: document.getElementById("createResourceForm"),
  resourceName: document.getElementById("resourceName"),
  resourceDescription: document.getElementById("resourceDescription"),

  // Lista
  resourcesList: document.getElementById("resourcesList"),
  emptyState: document.getElementById("emptyState"),
  loadingState: document.getElementById("loadingState"),

  // Modal Editar
  editModal: document.getElementById("editModal"),
  editModalClose: document.getElementById("editModalClose"),
  editForm: document.getElementById("editResourceForm"),
  editResourceName: document.getElementById("editResourceName"),
  editResourceDescription: document.getElementById("editResourceDescription"),
  editResourceStatus: document.getElementById("editResourceStatus"), // Adicionado campo de status
  cancelEdit: document.getElementById("cancelEdit"),
  confirmEdit: document.getElementById("confirmEdit"),

  // Modal Deletar
  deleteModal: document.getElementById("deleteModal"),
  modalClose: document.getElementById("modalClose"),
  cancelDelete: document.getElementById("cancelDelete"),
  confirmDelete: document.getElementById("confirmDelete"),
  modalResourceName: document.getElementById("modalResourceName"),
}

// Variáveis globais
let resourceToDelete = null
let resourceToEdit = null
let resourcesChart = null

// ===== INICIALIZAÇÃO =====
function init() {
  console.log("Iniciando dashboard...")

  // Exibe informações do usuário
  elements.userName.textContent = user.username
  elements.userRole.textContent = user.role

  // Mostra formulário de criação se tiver permissão
  if (permissions.canCreate) {
    elements.createSection.style.display = "block"
  } else {
    elements.createSection.style.display = "none"
  }

  // Carrega estatísticas e recursos
  loadDashboardStats()
  loadResources()

  // Event Listeners
  elements.logoutBtn.addEventListener("click", handleLogout)
  elements.createForm.addEventListener("submit", handleCreateResource)

  // Modal Editar
  elements.editModalClose.addEventListener("click", closeEditModal)
  elements.cancelEdit.addEventListener("click", closeEditModal)
  elements.confirmEdit.addEventListener("click", handleConfirmEdit)

  // Modal Deletar
  elements.modalClose.addEventListener("click", closeDeleteModal)
  elements.cancelDelete.addEventListener("click", closeDeleteModal)
  elements.confirmDelete.addEventListener("click", handleConfirmDelete)

  // Fecha modais ao clicar fora
  elements.editModal.addEventListener("click", (e) => {
    if (e.target === elements.editModal) closeEditModal()
  })

  elements.deleteModal.addEventListener("click", (e) => {
    if (e.target === elements.deleteModal) closeDeleteModal()
  })

  elements.activityPeriodFilter.addEventListener("change", () => {
    loadDashboardStats()
  })
}

// ===== CARREGAR ESTATÍSTICAS =====
async function loadDashboardStats() {
  try {
    const period = elements.activityPeriodFilter?.value || "all"
    const response = await fetch(`${API_URL}/dashboard/stats?period=${period}`, {
      headers: { "X-User-Id": user.id.toString() },
    })

    if (!response.ok) throw new Error("Erro ao carregar estatísticas")

    const stats = await response.json()
    console.log("Estatísticas:", stats)

    // Atualiza cards de métricas
    elements.totalResources.textContent = stats.total_resources || 0
    elements.totalUsers.textContent = stats.total_users || 0
    elements.activeResources.textContent = stats.active_resources || 0

    // Renderiza atividades recentes
    renderActivities(stats.recent_activities || [])

    // Cria gráfico de distribuição
    createResourcesChart(stats.resources_by_status || [])
  } catch (error) {
    console.error("Erro ao carregar estatísticas:", error)
  }
}

// ===== RENDERIZAR ATIVIDADES RECENTES =====
function renderActivities(activities) {
  if (activities.length === 0) {
    elements.activityList.innerHTML =
      '<p style="color: #a1a1aa; text-align: center; padding: 20px;">Nenhuma atividade recente</p>'
    return
  }

  elements.activityList.innerHTML = activities
    .map((activity) => {
      const date = new Date(activity.create_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })

      let activityClass = "activity-created"
      let actionText = "Recurso criado"

      if (activity.action === "created") {
        activityClass = "activity-created"
        actionText = "Recurso criado"
      } else if (activity.action === "deleted") {
        activityClass = "activity-deleted"
        actionText = "Recurso excluído"
      } else if (activity.action === "status_change") {
        // É uma mudança de status
        activityClass = `activity-${activity.new_status}`

        const statusTranslations = {
          active: "Ativo",
          maintenance: "Em Manutenção",
          inactive: "Inativo",
        }

        const oldStatusText = statusTranslations[activity.old_status] || activity.old_status
        const newStatusText = statusTranslations[activity.new_status] || activity.new_status

        actionText = `Status alterado: ${oldStatusText} → ${newStatusText}`
      } else if (activity.action === "name_change") {
        activityClass = "activity-updated"
        actionText = `Nome alterado: "${activity.old_value}" → "${activity.new_value}"`
      } else if (activity.action === "description_change") {
        activityClass = "activity-updated"
        actionText = "Descrição atualizada"
      } else if (activity.status) {
        // É um recurso com status (fallback quando não há tabela de logs)
        activityClass = `activity-${activity.status}`
        actionText = `Recurso ${activity.status === "active" ? "ativo" : activity.status === "maintenance" ? "em manutenção" : "inativo"}`
      }

      return `
            <div class="activity-item ${activityClass}">
                <span class="activity-name">${escapeHtml(activity.name)}</span>
                <span class="activity-action">${actionText}</span>
                <span class="activity-date">${date}</span>
            </div>
        `
    })
    .join("")
}

// ===== CRIAR GRÁFICO DE RECURSOS =====
function createResourcesChart(data) {
  const canvas = document.getElementById("resourcesChart")

  // Destrói gráfico anterior se existir
  if (resourcesChart) {
    resourcesChart.destroy()
  }

  // Prepara dados
  const labels = data.map((item) => item.status)
  const values = data.map((item) => item.count)
  const colors = {
    active: "#1faa6f",
    maintenance: "#b2771dff",
    inactive: "#d61f3a",
  }

  resourcesChart = new window.Chart(canvas, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: values,
          backgroundColor: labels.map((label) => colors[label] || "#a1a1aa"),
          borderColor: "#1a1c22",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#e6e6e6",
            padding: 15,
            font: { size: 12 },
          },
        },
      },
    },
  })
}

// ===== CARREGAR RECURSOS =====
async function loadResources() {
  try {
    elements.loadingState.style.display = "block"
    elements.resourcesList.innerHTML = ""
    elements.emptyState.style.display = "none"

    const response = await fetch(`${API_URL}/resources`, {
      headers: { "X-User-Id": user.id.toString() },
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        alert("Sessão expirada. Faça login novamente.")
        handleLogout()
        return
      }
      throw new Error("Erro ao carregar recursos")
    }

    const resources = await response.json()
    elements.loadingState.style.display = "none"

    if (!resources || resources.length === 0) {
      elements.emptyState.style.display = "block"
      return
    }

    renderResources(resources)
  } catch (error) {
    console.error("Erro:", error)
    elements.loadingState.style.display = "none"
    elements.emptyState.style.display = "block"
  }
}

// ===== RENDERIZAR RECURSOS =====
function renderResources(resources) {
  elements.resourcesList.innerHTML = ""

  resources.forEach((resource) => {
    const card = createResourceCard(resource)
    elements.resourcesList.appendChild(card)
  })
}

// ===== CRIAR CARD DE RECURSO =====
function createResourceCard(resource) {
  const card = document.createElement("div")
  card.className = `resource-card status-${resource.status || "active"}`

  let formattedDate = "Data não disponível"
  if (resource.create_at) {
    try {
      const date = new Date(resource.create_at)
      formattedDate = date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    } catch (e) {
      console.error("Erro ao formatar data:", e)
    }
  }

  // Define a classe CSS baseada no status
  const statusClass = `status-${resource.status || "active"}`

  card.innerHTML = `
        <div class="resource-header">
            <h3 class="resource-name">${escapeHtml(resource.name)}</h3>
            <span class="resource-status ${statusClass}">${escapeHtml(resource.status || "active")}</span>
        </div>
        <p class="resource-description">${escapeHtml(resource.description || "Sem descrição")}</p>
        <div class="resource-footer">
            <span class="resource-date">Criado em ${formattedDate}</span>
            <div class="resource-actions">
                ${
                  permissions.canEdit
                    ? `
                    <button class="btn-edit" data-id="${resource.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Editar
                    </button>
                `
                    : ""
                }
                ${
                  permissions.canDelete
                    ? `
                    <button class="btn-delete" data-id="${resource.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Excluir
                    </button>
                `
                    : ""
                }
            </div>
        </div>
    `

  // Event listeners
  if (permissions.canEdit) {
    const editBtn = card.querySelector(".btn-edit")
    if (editBtn) {
      editBtn.addEventListener("click", () => openEditModal(resource))
    }
  }

  if (permissions.canDelete) {
    const deleteBtn = card.querySelector(".btn-delete")
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => openDeleteModal(resource.id, resource.name))
    }
  }

  return card
}

// ===== CRIAR NOVO RECURSO =====
async function handleCreateResource(e) {
  e.preventDefault()

  const name = elements.resourceName.value.trim()
  const description = elements.resourceDescription.value.trim()

  if (!name || !description) {
    alert("Preencha todos os campos")
    return
  }

  try {
    const response = await fetch(`${API_URL}/resources`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": user.id.toString(),
      },
      body: JSON.stringify({ name, description }),
    })

    if (!response.ok) {
      if (response.status === 403) {
        alert("Você não tem permissão para criar recursos.")
        return
      }
      throw new Error("Erro ao criar recurso")
    }

    elements.createForm.reset()
    await loadResources()
    await loadDashboardStats()
    alert("Recurso criado com sucesso!")
  } catch (error) {
    console.error("Erro:", error)
    alert(`Erro ao criar recurso: ${error.message}`)
  }
}

// ===== MODAL DE EDIÇÃO =====
function openEditModal(resource) {
  resourceToEdit = resource
  elements.editResourceName.value = resource.name
  elements.editResourceDescription.value = resource.description
  elements.editResourceStatus.value = resource.status || "active" // Preenche o status atual
  elements.editModal.classList.add("active")
}

function closeEditModal() {
  resourceToEdit = null
  elements.editForm.reset()
  elements.editModal.classList.remove("active")
}

async function handleConfirmEdit() {
  if (!resourceToEdit) return

  const name = elements.editResourceName.value.trim()
  const description = elements.editResourceDescription.value.trim()
  const status = elements.editResourceStatus.value // Captura o novo status

  if (!name || !description) {
    alert("Preencha todos os campos")
    return
  }

  try {
    const response = await fetch(`${API_URL}/resource/${resourceToEdit.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": user.id.toString(),
      },
      body: JSON.stringify({ name, description, status }), // Envia o status
    })

    if (!response.ok) {
      if (response.status === 403) {
        alert("Você não tem permissão para editar recursos.")
        closeEditModal()
        return
      }
      throw new Error("Erro ao editar recurso")
    }

    closeEditModal()
    await loadResources()
    await loadDashboardStats()
    alert("Recurso atualizado com sucesso!")
  } catch (error) {
    console.error("Erro:", error)
    alert(`Erro ao editar recurso: ${error.message}`)
  }
}

// ===== MODAL DE DELETE =====
function openDeleteModal(id, name) {
  resourceToDelete = id
  elements.modalResourceName.textContent = name
  elements.deleteModal.classList.add("active")
}

function closeDeleteModal() {
  resourceToDelete = null
  elements.deleteModal.classList.remove("active")
}

async function handleConfirmDelete() {
  if (!resourceToDelete) return

  try {
    const response = await fetch(`${API_URL}/resource/${resourceToDelete}`, {
      method: "DELETE",
      headers: { "X-User-Id": user.id.toString() },
    })

    if (!response.ok) {
      if (response.status === 403) {
        alert("Você não tem permissão para excluir recursos.")
        closeDeleteModal()
        return
      }
      throw new Error("Erro ao excluir recurso")
    }

    closeDeleteModal()
    await loadResources()
    await loadDashboardStats()
    alert("Recurso excluído com sucesso!")
  } catch (error) {
    console.error("Erro:", error)
    alert(`Erro ao excluir recurso: ${error.message}`)
  }
}

// ===== LOGOUT =====
function handleLogout() {
  localStorage.removeItem("user")
  window.location.href = "/frontend/index.html"
}

// ===== SANITIZAR HTML =====
function escapeHtml(text) {
  if (!text) return ""
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

// ===== INICIA O DASHBOARD =====
init()
