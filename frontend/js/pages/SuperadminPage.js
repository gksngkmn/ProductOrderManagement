// =========================================
// 1. GÜVENLİK (GUARD) VE BAŞLATMA
// =========================================
(function checkSuperAdminAuth() {
    try {
        const user = AuthManager.getUser();
        const token = AuthManager.getToken();
        if (!token || !user || user.role !== 'superadmin') {
            alert("Erişim Engellendi: Bu alana yalnızca Süper Yönetici erişebilir.");
            window.location.href = '/index.html';
        } else {
            document.documentElement.style.display = 'block';
            document.getElementById("adminName").innerText = user.username;
        }
    } catch (e) {
        window.location.href = '/index.html';
    }
})();

// =========================================
// 2. DOM ELEMENTLERİ
// =========================================
const managerListContainer = document.getElementById("managerListContainer");
const welcomeMessage = document.getElementById("welcomeMessage");
const managerDetailPanel = document.getElementById("managerDetailPanel");
const customerEditPanel = document.getElementById("customerEditPanel");
const customerListContainer = document.getElementById("customerListContainer");
const customerNameSearchInput = document.getElementById("customerNameSearchInput");
const superadminNotice = document.getElementById("superadminNotice");
let superadminNoticeTimer;
let currentManagerCustomers = [];

function showSuperadminNotice(message, type = "success") {
    clearTimeout(superadminNoticeTimer);
    superadminNotice.textContent = message;
    superadminNotice.className = `superadmin-notice ${type}`;
    superadminNoticeTimer = setTimeout(() => {
        superadminNotice.classList.add("hidden");
    }, 5000);
}

document.getElementById("btnShowManagerCreate").addEventListener("click", () => {
    managerDetailPanel.classList.add("hidden");
    customerEditPanel.classList.add("hidden");
    welcomeMessage.classList.remove("hidden");
    document.getElementById("managerCreateForm").classList.remove("hidden");
});

document.getElementById("btnShowCustomerCreate").addEventListener("click", () => {
    document.getElementById("customerCreateForm").classList.remove("hidden");
});

document.getElementById("btnCancelCustomerCreate").addEventListener("click", () => {
    document.getElementById("customerCreateForm").classList.add("hidden");
});

function setContainerMessage(container, message, isError = false) {
    const messageElement = document.createElement("p");
    messageElement.textContent = message;

    if (isError) {
        messageElement.style.color = "red";
    }

    container.replaceChildren(messageElement);
}

function createManagerCard(manager) {
    const card = document.createElement("div");
    card.className = "manager-card";

    const title = document.createElement("h4");
    title.textContent = manager.username || "-";

    const details = document.createElement("p");
    const fullName = [manager.name, manager.surname].filter(Boolean).join(" ");
    details.textContent = `${fullName || "-"} | ${manager.email || "Email yok"}`;

    card.append(title, details);
    card.addEventListener("click", () => openManagerDetails(manager));

    return card;
}

function createCustomerRow(customer) {
    const row = document.createElement("div");
    row.className = "customer-row";

    const companyCell = document.createElement("div");
    const companyName = document.createElement("strong");
    companyName.textContent = customer.company_name || "-";
    companyCell.append(companyName);

    const nameCell = document.createElement("div");
    nameCell.textContent = [customer.name, customer.surname]
        .filter(Boolean)
        .join(" ") || "-";

    const emailCell = document.createElement("div");
    emailCell.textContent = customer.email || "-";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "light";
    editButton.textContent = "Düzenle";
    editButton.addEventListener("click", () => openCustomerEdit(customer));

    const detailsButton = document.createElement("button");
    detailsButton.type = "button";
    detailsButton.className = "light";
    detailsButton.textContent = "Details";
    detailsButton.addEventListener("click", () => {
        window.location.href =
            `/customerDetails.html?companyId=${encodeURIComponent(customer.id)}&from=superadmin`;
    });

    const orderHistoryButton = document.createElement("button");
    orderHistoryButton.type = "button";
    orderHistoryButton.className = "light";
    orderHistoryButton.textContent = "Order History";
    orderHistoryButton.addEventListener("click", () => {
        window.location.href =
            `/orderHistory.html?companyId=${encodeURIComponent(customer.id)}&from=superadmin`;
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "danger";
    deleteButton.textContent = "Sil";
    deleteButton.addEventListener("click", () => deleteCustomer(customer));

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "8px";
    actions.style.flexWrap = "wrap";
    actions.style.justifyContent = "flex-end";
    actions.append(detailsButton, orderHistoryButton, editButton, deleteButton);

    row.append(companyCell, nameCell, emailCell, actions);
    return row;
}

// =========================================
// 3. MANAGER İŞLEMLERİ
// =========================================
async function loadManagers() {
    try {
        const managers = await ClientApi.request("/superadmin/managers");

        managerListContainer.replaceChildren(
            ...managers.map(createManagerCard)
        );
    } catch (err) {
        setContainerMessage(
            managerListContainer,
            "Yöneticiler yüklenemedi.",
            true
        );
    }
}

async function openManagerDetails(manager) {
    welcomeMessage.classList.add("hidden");
    managerDetailPanel.classList.remove("hidden");
    customerEditPanel.classList.add("hidden");
    customerNameSearchInput.value = "";

    // Manager formunu doldur
    document.getElementById("selectedManagerTitle").textContent = `Yönetici: ${manager.username || "-"}`;
    document.getElementById("editManagerId").value = manager.id;
    document.getElementById("m_username").value = manager.username || '';
    document.getElementById("m_email").value = manager.email || '';
    document.getElementById("m_name").value = manager.name || '';
    document.getElementById("m_surname").value = manager.surname || '';
    PhoneInput.setValue("m_phone", manager.phone || '');

    // Müşterilerini getir
    loadCustomersOfManager(manager.id);
}

document.getElementById("managerCreateForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = {
        username: document.getElementById("new_m_username").value.trim(),
        password: document.getElementById("new_m_password").value,
        name: document.getElementById("new_m_name").value.trim(),
        surname: document.getElementById("new_m_surname").value.trim(),
        email: document.getElementById("new_m_email").value.trim(),
        phone: PhoneInput.getValue("new_m_phone")
    };

    try {
        await ClientApi.request("/superadmin/managers", {
            method: "POST",
            body: JSON.stringify(payload)
        });
        form.reset();
        form.classList.add("hidden");
        await loadManagers();
        alert("Manager başarıyla oluşturuldu.");
    } catch (error) {
        alert(error.message);
    }
});

document.getElementById("managerDeleteForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const managerId = document.getElementById("editManagerId").value;
    if (!confirm("Manager ve ona bağlı tüm customer, sipariş ve ürünler silinsin mi? Bu işlem geri alınamaz.")) return;

    try {
        const result = await ClientApi.request(`/superadmin/managers/${managerId}`, {
            method: "DELETE"
        });
        managerDetailPanel.classList.add("hidden");
        customerEditPanel.classList.add("hidden");
        welcomeMessage.classList.remove("hidden");
        await loadManagers();
        alert(result.message);
    } catch (error) {
        alert(error.message);
    }
});

document.getElementById("customerCreateForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const managerId = document.getElementById("editManagerId").value;
    const payload = {
        username: document.getElementById("new_c_username").value.trim(),
        password: document.getElementById("new_c_password").value,
        name: document.getElementById("new_c_name").value.trim(),
        surname: document.getElementById("new_c_surname").value.trim(),
        email: document.getElementById("new_c_email").value.trim(),
        phone: PhoneInput.getValue("new_c_phone"),
        companyName: document.getElementById("new_c_company").value.trim(),
        companyPhone: PhoneInput.getValue("new_c_company_phone"),
        address: document.getElementById("new_c_address").value.trim(),
        country: document.getElementById("new_c_country").value.trim(),
        city: document.getElementById("new_c_city").value.trim()
    };

    try {
        await ClientApi.request(`/superadmin/managers/${managerId}/customers`, {
            method: "POST",
            body: JSON.stringify(payload)
        });
        form.reset();
        form.classList.add("hidden");
        showSuperadminNotice("Customer created successfully.");
        await loadCustomersOfManager(managerId);
    } catch (error) {
        showSuperadminNotice(error.message, "error");
    }
});

document.getElementById("managerEditForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("editManagerId").value;
    const payload = {
        username: document.getElementById("m_username").value,
        email: document.getElementById("m_email").value,
        name: document.getElementById("m_name").value,
        surname: document.getElementById("m_surname").value,
        phone: PhoneInput.getValue("m_phone")
    };

    try {
        const data = await ClientApi.request(`/superadmin/managers/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });
        alert(data.message || "Başarıyla güncellendi");
        loadManagers(); // Listeyi yenile
    } catch (err) {
        alert("Güncelleme hatası");
    }
});

// =========================================
// 4. CUSTOMER İŞLEMLERİ
// =========================================
function renderManagerCustomers() {
    const query = customerNameSearchInput.value.trim().toLocaleLowerCase();

    if (currentManagerCustomers.length === 0) {
        setContainerMessage(
            customerListContainer,
            "Bu yöneticiye bağlı müşteri bulunamadı."
        );
        return;
    }

    const filteredCustomers = currentManagerCustomers.filter((customer) => {
        const fullName = [customer.name, customer.surname]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase();
        return fullName.includes(query);
    });

    if (filteredCustomers.length === 0) {
        setContainerMessage(customerListContainer, "No customers match the search.");
        return;
    }

    customerListContainer.replaceChildren(
        ...filteredCustomers.map(createCustomerRow)
    );
}

customerNameSearchInput.addEventListener("input", renderManagerCustomers);

async function loadCustomersOfManager(managerId) {
    setContainerMessage(customerListContainer, "Yükleniyor...");
    try {
        currentManagerCustomers = await ClientApi.request(
            `/superadmin/managers/${managerId}/customers`
        );
        renderManagerCustomers();
    } catch (err) {
        currentManagerCustomers = [];
        setContainerMessage(
            customerListContainer,
            "Müşteriler yüklenirken hata oluştu.",
            true
        );
    }
}

function openCustomerEdit(customer) {
    customerEditPanel.classList.remove("hidden");

    document.getElementById("c_id_label").textContent = customer.id;
    document.getElementById("editCustomerId").value = customer.id;
    document.getElementById("c_company").value = customer.company_name || '';
    document.getElementById("c_email").value = customer.email || '';
    document.getElementById("c_name").value = customer.name || '';
    document.getElementById("c_surname").value = customer.surname || '';
    document.getElementById("c_country").value = customer.country || '';
    document.getElementById("c_city").value = customer.city || '';

    // Sayfayı hafif aşağı kaydır (modal görünmesi için)
    customerEditPanel.scrollIntoView({ behavior: 'smooth' });
}

async function deleteCustomer(customer) {
    if (!confirm(`${customer.company_name || customer.username} silinsin mi? Siparişleri de silinir.`)) {
        return;
    }

    try {
        const result = await ClientApi.request(`/superadmin/customers/${customer.id}`, {
            method: "DELETE"
        });
        const managerId = document.getElementById("editManagerId").value;
        customerEditPanel.classList.add("hidden");
        await loadCustomersOfManager(managerId);
        alert(result.message);
    } catch (error) {
        alert(error.message);
    }
}

document.getElementById("customerEditForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("editCustomerId").value;
    const managerId = document.getElementById("editManagerId").value; // Ekranın üstündeki manager ID

    const payload = {
        company_name: document.getElementById("c_company").value,
        email: document.getElementById("c_email").value,
        name: document.getElementById("c_name").value,
        surname: document.getElementById("c_surname").value,
        country: document.getElementById("c_country").value,
        city: document.getElementById("c_city").value
    };

    try {
        const data = await ClientApi.request(`/superadmin/customers/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });
        alert(data.message || "Müşteri başarıyla güncellendi");

        customerEditPanel.classList.add("hidden");
        loadCustomersOfManager(managerId); // Müşteri listesini güncelle
    } catch (err) {
        alert("Güncelleme hatası");
    }
});

document.getElementById("btnCancelCustomerEdit").addEventListener("click", () => {
    customerEditPanel.classList.add("hidden");
});

// ÇIKIŞ BUTONU
document.getElementById("btnLogout").addEventListener("click", () => {
    if(confirm("Sistemden çıkış yapmak istediğinize emin misiniz?")) {
        AuthManager.logout();
    }
});

// SAYFA YÜKLENİNCE BAŞLAT
loadManagers();
import AuthManager from "../core/AuthManager.js";
import ClientApi from "../api/ClientApi.js";
