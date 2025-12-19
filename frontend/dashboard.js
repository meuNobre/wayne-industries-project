const API_URL = window.CONFIG.API_URL

// ===== VERIFICAÇÃO DE AUTENTICAÇÃO =====
const user = JSON.parse(localStorage.getItem("user"))

if (!user) {
  window.location.href = "index.html"
}

// ===== CONTROLE DE PERMISSÕES =====
const permissions = {
  canCreate: ["manager", "admin"].includes(user.role),
  canEdit: ["manager", "admin"].includes(user.role),
  canDelete: user.role === "admin",
  canManageUsers: user.role === "admin",
}

// ===== ELEMENTOS DO DOM =====
const elements = {
  userName: document.getElementById("userName"),
  userRole: document.getElementById("userRole"),
  logoutBtn: document.getElementById("logoutBtn"),

  navTabs: document.querySelectorAll(".nav-tab"),
  usersTab: document.getElementById("usersTab"),
  sections: document.querySelectorAll(".section-content"),

  // Estatísticas
  totalResources: document.getElementById("totalResources"),
  totalUsers: document.getElementById("totalUsers"),
  activeResources: document.getElementById("activeResources"),
  activityList: document.getElementById("activityList"),
  activityPeriodFilter: document.getElementById("activityPeriodFilter"),

  // Formulário criar recurso
  createSection: document.getElementById("createSection"),
  createForm: document.getElementById("createResourceForm"),
  resourceName: document.getElementById("resourceName"),
  resourceDescription: document.getElementById("resourceDescription"),

  // Lista de recursos
  resourcesList: document.getElementById("resourcesList"),
  emptyState: document.getElementById("emptyState"),
  loadingState: document.getElementById("loadingState"),

  createUserForm: document.getElementById("createUserForm"),
  newUsername: document.getElementById("newUsername"),
  newPassword: document.getElementById("newPassword"),
  newUserRole: document.getElementById("newUserRole"),
  usersList: document.getElementById("usersList"),
  usersLoadingState: document.getElementById("usersLoadingState"),

  // Modal Editar
  editModal: document.getElementById("editModal"),
  editModalClose: document.getElementById("editModalClose"),
  editForm: document.getElementById("editResourceForm"),
  editResourceName: document.getElementById("editResourceName"),
  editResourceDescription: document.getElementById("editResourceDescription"),
  editResourceStatus: document.getElementById("editResourceStatus"),
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
let currentSection = "stats"

// ===== INICIALIZAÇÃO =====
function init() {
  console.log("Iniciando dashboard...")

  // Exibe informações do usuário
  elements.userName.textContent = user.username
  elements.userRole.textContent = user.role

  if (permissions.canManageUsers) {
    elements.usersTab.style.display = "block"
  }

  // Mostra formulário de criação se tiver permissão
  if (permissions.canCreate) {
    elements.createSection.style.display = "block"
  } else {
    elements.createSection.style.display = "none"
  }

  // Carrega dados iniciais
  loadDashboardStats()
  loadResources()

  elements.navTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchSection(tab.dataset.section))
  })

  // Event Listeners existentes
  elements.logoutBtn.addEventListener("click", handleLogout)
  elements.createForm.addEventListener("submit", handleCreateResource)

  if (elements.createUserForm) {
    elements.createUserForm.addEventListener("submit", handleCreateUser)
  }

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

function switchSection(section) {
  currentSection = section

  // Remove active de todas as abas e seções
  elements.navTabs.forEach((tab) => tab.classList.remove("active"))
  elements.sections.forEach((sec) => sec.classList.remove("active"))

  // Adiciona active na aba e seção clicada
  document.querySelector(`[data-section="${section}"]`).classList.add("active")
  document.getElementById(`${section}Section`).classList.add("active")

  // Carrega dados da seção
  if (section === "stats") {
    loadDashboardStats()
  } else if (section === "resources") {
    loadResources()
  } else if (section === "users" && permissions.canManageUsers) {
    loadUsers()
  }
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

  if (resourcesChart) {
    resourcesChart.destroy()
  }

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

async function loadUsers() {
  if (!permissions.canManageUsers) return

  try {
    elements.usersLoadingState.style.display = "block"
    elements.usersList.innerHTML = ""

    const response = await fetch(`${API_URL}/users`, {
      headers: { "X-User-Id": user.id.toString() },
    })

    if (!response.ok) {
      throw new Error("Erro ao carregar usuários")
    }

    const users = await response.json()
    elements.usersLoadingState.style.display = "none"

    renderUsers(users)
  } catch (error) {
    console.error("Erro ao carregar usuários:", error)
    elements.usersLoadingState.style.display = "none"
    elements.usersList.innerHTML =
      '<p style="color: #a1a1aa; text-align: center; padding: 20px;">Erro ao carregar usuários</p>'
  }
}

function renderUsers(users) {
  if (!users || users.length === 0) {
    elements.usersList.innerHTML =
      '<p style="color: #a1a1aa; text-align: center; padding: 20px;">Nenhum usuário encontrado</p>'
    return
  }

  elements.usersList.innerHTML = users
    .map((u) => {
      const roleColors = {
        admin: "#d61f3a",
        manager: "#b2771dff",
        employee: "#1faa6f",
      }

      const roleNames = {
        admin: "Administrador",
        manager: "Gerente",
        employee: "Funcionário",
      }

      return `
      <div class="user-card">
        <div class="user-card-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <div class="user-card-body">
          <h4>${escapeHtml(u.username)}</h4>
          <span class="user-role-badge" style="background-color: ${roleColors[u.role]};">
            ${roleNames[u.role] || u.role}
          </span>
        </div>
      </div>
    `
    })
    .join("")
}

async function handleCreateUser(e) {
  e.preventDefault()

  if (!permissions.canManageUsers) {
    alert("Você não tem permissão para criar usuários.")
    return
  }

  const username = elements.newUsername.value.trim()
  const password = elements.newPassword.value.trim()
  const role = elements.newUserRole.value

  if (!username || !password || !role) {
    alert("Preencha todos os campos")
    return
  }

  try {
    const response = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": user.id.toString(),
      },
      body: JSON.stringify({ username, password, role }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Erro ao criar usuário")
    }

    elements.createUserForm.reset()
    await loadUsers()
    await loadDashboardStats()
    alert("Usuário criado com sucesso!")
  } catch (error) {
    console.error("Erro:", error)
    alert(`Erro ao criar usuário: ${error.message}`)
  }
}

// ===== MODAL DE EDIÇÃO =====
function openEditModal(resource) {
  resourceToEdit = resource
  elements.editResourceName.value = resource.name
  elements.editResourceDescription.value = resource.description
  elements.editResourceStatus.value = resource.status || "active"
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
  const status = elements.editResourceStatus.value

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
      body: JSON.stringify({ name, description, status }),
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
  window.location.href = "index.html"
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
