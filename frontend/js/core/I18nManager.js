(function () {
  const STORAGE_KEY = "language";
  const supported = ["en", "tr", "zh"];
  const translations = {
    "Login": ["Login", "Giriş", "登录"],
    "Logout": ["Logout", "Çıkış", "退出"],
    "Manager": ["Manager", "Yönetici", "经理"],
    "Customer": ["Customer", "Müşteri", "客户"],
    "Managers": ["Managers", "Yöneticiler", "经理"],
    "Customers": ["Customers", "Müşteriler", "客户"],
    "Products": ["Products", "Ürünler", "产品"],
    "Orders": ["Orders", "Siparişler", "订单"],
    "Product Order Management": ["Product Order Management", "Ürün Sipariş Yönetimi", "产品订单管理"],
    "Manager Login": ["Manager Login", "Yönetici Girişi", "经理登录"],
    "Customer Login": ["Customer Login", "Müşteri Girişi", "客户登录"],
    "Manager Panel": ["Manager Panel", "Yönetici Paneli", "经理面板"],
    "Customer Panel": ["Customer Panel", "Müşteri Paneli", "客户面板"],
    "Consistent Design": ["Consistent Design", "Tutarlı Tasarım", "一致的设计"],
    "Manage products, customers, and orders in one clean system. Fast, organized, and built for long-term growth.": ["Manage products, customers, and orders in one clean system. Fast, organized, and built for long-term growth.", "Ürünleri, müşterileri ve siparişleri tek bir düzenli sistemde yönetin.", "在一个简洁的系统中管理产品、客户和订单。"],
    "Manage customers, products, and order operations.": ["Manage customers, products, and order operations.", "Müşteri, ürün ve sipariş işlemlerini yönetin.", "管理客户、产品和订单操作。"],
    "Create orders, add items, and follow your order flow easily.": ["Create orders, add items, and follow your order flow easily.", "Sipariş oluşturun, ürün ekleyin ve süreci kolayca takip edin.", "创建订单、添加商品并轻松跟踪订单流程。"],
    "A clean blue-white interface for a professional product feel.": ["A clean blue-white interface for a professional product feel.", "Profesyonel bir görünüm için sade mavi-beyaz arayüz.", "简洁的蓝白界面，呈现专业体验。"],
    "Enter your credentials to continue.": ["Enter your credentials to continue.", "Devam etmek için giriş bilgilerinizi girin.", "请输入登录信息以继续。"],
    "Username": ["Username", "Kullanıcı Adı", "用户名"],
    "Password": ["Password", "Parola", "密码"],
    "Email": ["Email", "E-posta", "电子邮件"],
    "Phone": ["Phone", "Telefon", "电话"],
    "Name": ["Name", "Ad", "名字"],
    "Surname": ["Surname", "Soyad", "姓氏"],
    "Country": ["Country", "Ülke", "国家"],
    "City": ["City", "Şehir", "城市"],
    "Address": ["Address", "Adres", "地址"],
    "Company": ["Company", "Şirket", "公司"],
    "Company Name": ["Company Name", "Şirket Adı", "公司名称"],
    "Company Phone": ["Company Phone", "Şirket Telefonu", "公司电话"],
    "Actions": ["Actions", "İşlemler", "操作"],
    "Edit": ["Edit", "Düzenle", "编辑"],
    "Delete": ["Delete", "Sil", "删除"],
    "Cancel": ["Cancel", "İptal", "取消"],
    "Save": ["Save", "Kaydet", "保存"],
    "Update": ["Update", "Güncelle", "更新"],
    "Create": ["Create", "Oluştur", "创建"],
    "Add": ["Add", "Ekle", "添加"],
    "Details": ["Details", "Detaylar", "详情"],
    "Transfer": ["Transfer", "Transfer", "转移"],
    "Search": ["Search", "Ara", "搜索"],
    "Filter": ["Filter", "Filtrele", "筛选"],
    "Status": ["Status", "Durum", "状态"],
    "Current": ["Current", "Aktif", "当前"],
    "Completed": ["Completed", "Tamamlandı", "已完成"],
    "Quantity": ["Quantity", "Miktar", "数量"],
    "Unit Price": ["Unit Price", "Birim Fiyat", "单价"],
    "Total": ["Total", "Toplam", "总计"],
    "Material": ["Material", "Malzeme", "材料"],
    "Type": ["Type", "Tür", "类型"],
    "Model": ["Model", "Model", "型号"],
    "Width": ["Width", "Genişlik", "宽度"],
    "Language": ["Language", "Dil", "语言"],
    "Forgot Password?": ["Forgot Password?", "Parolamı Unuttum", "忘记密码？"],
    "Forgot Password": ["Forgot Password", "Parolamı Unuttum", "忘记密码"],
    "Close": ["Close", "Kapat", "关闭"],
    "Verification Code": ["Verification Code", "Doğrulama Kodu", "验证码"],
    "Request Verification Code": ["Request Verification Code", "Doğrulama Kodu İste", "获取验证码"],
    "New Manager": ["New Manager", "Yeni Yönetici", "新建经理"],
    "Yeni Manager Oluştur": ["Create New Manager", "Yeni Manager Oluştur", "新建经理"],
    "Yeni Customer Ekle": ["Add New Customer", "Yeni Customer Ekle", "添加新客户"],
    "Manager Oluştur": ["Create Manager", "Manager Oluştur", "创建经理"],
    "Customer Oluştur": ["Create Customer", "Customer Oluştur", "创建客户"],
    "Sistemden Çık": ["Logout", "Sistemden Çık", "退出系统"],
    "Süper Yönetici Paneli": ["Superadmin Panel", "Süper Yönetici Paneli", "超级管理员面板"],
    "Yönetici Detayları": ["Manager Details", "Yönetici Detayları", "经理详情"],
    "Bu Yöneticiye Bağlı Müşteriler": ["Customers Assigned to This Manager", "Bu Yöneticiye Bağlı Müşteriler", "该经理的客户"],
    "Yükleniyor...": ["Loading...", "Yükleniyor...", "加载中..."],
    "Enter username": ["Enter username", "Kullanıcı adını girin", "输入用户名"],
    "Enter password": ["Enter password", "Parolayı girin", "输入密码"],
    "Enter username or email": ["Enter username or email", "Kullanıcı adı veya e-posta girin", "输入用户名或邮箱"]
    ,"All": ["All", "Tümü", "全部"]
    ,"All Cities": ["All Cities", "Tüm Şehirler", "所有城市"]
    ,"All Countries": ["All Countries", "Tüm Ülkeler", "所有国家"]
    ,"All Months": ["All Months", "Tüm Aylar", "所有月份"]
    ,"All Years": ["All Years", "Tüm Yıllar", "所有年份"]
    ,"Add Customer": ["Add Customer", "Müşteri Ekle", "添加客户"]
    ,"Add Item": ["Add Item", "Ürün Ekle", "添加商品"]
    ,"Add Product": ["Add Product", "Ürün Ekle", "添加产品"]
    ,"Apply": ["Apply", "Uygula", "应用"]
    ,"Back to Customer List": ["Back to Customer List", "Müşteri Listesine Dön", "返回客户列表"]
    ,"Back to Customer Panel": ["Back to Customer Panel", "Müşteri Paneline Dön", "返回客户面板"]
    ,"Back to Manager Panel": ["Back to Manager Panel", "Yönetici Paneline Dön", "返回经理面板"]
    ,"Change Password": ["Change Password", "Parola Değiştir", "修改密码"]
    ,"Clear": ["Clear", "Temizle", "清除"]
    ,"Complete": ["Complete", "Tamamla", "完成"]
    ,"Confirm Password": ["Confirm Password", "Parolayı Doğrula", "确认密码"]
    ,"Create Customer": ["Create Customer", "Müşteri Oluştur", "创建客户"]
    ,"Currency": ["Currency", "Para Birimi", "货币"]
    ,"Current Order": ["Current Order", "Aktif Sipariş", "当前订单"]
    ,"Customer & Company Information": ["Customer & Company Information", "Müşteri ve Şirket Bilgileri", "客户与公司信息"]
    ,"Customer Details": ["Customer Details", "Müşteri Detayları", "客户详情"]
    ,"Customer Filters": ["Customer Filters", "Müşteri Filtreleri", "客户筛选"]
    ,"Customer Information": ["Customer Information", "Müşteri Bilgileri", "客户信息"]
    ,"Customer List": ["Customer List", "Müşteri Listesi", "客户列表"]
    ,"Dashboard": ["Dashboard", "Gösterge Paneli", "仪表板"]
    ,"Edit Customer": ["Edit Customer", "Müşteriyi Düzenle", "编辑客户"]
    ,"Edit Manager": ["Edit Manager", "Yöneticiyi Düzenle", "编辑经理"]
    ,"Edit Order Item": ["Edit Order Item", "Sipariş Kalemini Düzenle", "编辑订单项"]
    ,"Edit Product": ["Edit Product", "Ürünü Düzenle", "编辑产品"]
    ,"Export Excel": ["Export Excel", "Excel'e Aktar", "导出 Excel"]
    ,"Items": ["Items", "Kalemler", "商品项"]
    ,"Manager Information": ["Manager Information", "Yönetici Bilgileri", "经理信息"]
    ,"My Order History": ["My Order History", "Sipariş Geçmişim", "我的订单历史"]
    ,"New Password": ["New Password", "Yeni Parola", "新密码"]
    ,"No active order loaded.": ["No active order loaded.", "Aktif sipariş yüklenmedi.", "未加载当前订单。"]
    ,"No current order items.": ["No current order items.", "Aktif siparişte ürün yok.", "当前订单中没有商品。"]
    ,"No order selected.": ["No order selected.", "Sipariş seçilmedi.", "未选择订单。"]
    ,"Notification Method": ["Notification Method", "Bildirim Yöntemi", "通知方式"]
    ,"Order Code": ["Order Code", "Sipariş Kodu", "订单编号"]
    ,"Order Details": ["Order Details", "Sipariş Detayları", "订单详情"]
    ,"Order History": ["Order History", "Sipariş Geçmişi", "订单历史"]
    ,"Password Change": ["Password Change", "Parola Değişikliği", "密码修改"]
    ,"Product Filters": ["Product Filters", "Ürün Filtreleri", "产品筛选"]
    ,"Product Period": ["Product Period", "Ürün Dönemi", "产品周期"]
    ,"Profile Information": ["Profile Information", "Profil Bilgileri", "个人资料"]
    ,"Role": ["Role", "Rol", "角色"]
    ,"Save Changes": ["Save Changes", "Değişiklikleri Kaydet", "保存更改"]
    ,"Select an order to view details.": ["Select an order to view details.", "Detayları görmek için bir sipariş seçin.", "请选择订单以查看详情。"]
    ,"Send Product Updates": ["Send Product Updates", "Ürün Güncellemelerini Gönder", "发送产品更新"]
    ,"Sort by Type": ["Sort by Type", "Türe Göre Sırala", "按类型排序"]
    ,"Start Date": ["Start Date", "Başlangıç Tarihi", "开始日期"]
    ,"End Date": ["End Date", "Bitiş Tarihi", "结束日期"]
    ,"Submission Date": ["Submission Date", "Gönderim Tarihi", "提交日期"]
    ,"Submitted": ["Submitted", "Gönderildi", "已提交"]
    ,"Update Item": ["Update Item", "Kalemi Güncelle", "更新订单项"]
    ,"Update Product": ["Update Product", "Ürünü Güncelle", "更新产品"]
    ,"Username or Email": ["Username or Email", "Kullanıcı Adı veya E-posta", "用户名或邮箱"]
    ,"Verification Method": ["Verification Method", "Doğrulama Yöntemi", "验证方式"]
    ,"Verification Policy": ["Verification Policy", "Doğrulama Politikası", "验证策略"]
    ,"Year": ["Year", "Yıl", "年份"]
    ,"Month": ["Month", "Ay", "月份"]
    ,"Custom Date Range": ["Custom Date Range", "Özel Tarih Aralığı", "自定义日期范围"]
    ,"Last 7 Days": ["Last 7 Days", "Son 7 Gün", "最近 7 天"]
    ,"Last 14 Days": ["Last 14 Days", "Son 14 Gün", "最近 14 天"]
    ,"Last 30 Days": ["Last 30 Days", "Son 30 Gün", "最近 30 天"]
    ,"Last 3 Months": ["Last 3 Months", "Son 3 Ay", "最近 3 个月"]
    ,"Last 6 Months": ["Last 6 Months", "Son 6 Ay", "最近 6 个月"]
    ,"January": ["January", "Ocak", "一月"]
    ,"February": ["February", "Şubat", "二月"]
    ,"March": ["March", "Mart", "三月"]
    ,"April": ["April", "Nisan", "四月"]
    ,"May": ["May", "Mayıs", "五月"]
    ,"June": ["June", "Haziran", "六月"]
    ,"July": ["July", "Temmuz", "七月"]
    ,"August": ["August", "Ağustos", "八月"]
    ,"September": ["September", "Eylül", "九月"]
    ,"October": ["October", "Ekim", "十月"]
    ,"November": ["November", "Kasım", "十一月"]
    ,"December": ["December", "Aralık", "十二月"]
    ,"Default": ["Default", "Varsayılan", "默认"]
    ,"Angle": ["Angle", "Açı", "角度"]
    ,"Nodal Length": ["Nodal Length", "Nodal Uzunluk", "节点长度"]
    ,"Nodal Length (mm)": ["Nodal Length (mm)", "Nodal Uzunluk (mm)", "节点长度（毫米）"]
    ,"Number of Teeth": ["Number of Teeth", "Diş Sayısı", "齿数"]
    ,"Teeth": ["Teeth", "Diş", "齿"]
    ,"Width (mm)": ["Width (mm)", "Genişlik (mm)", "宽度（毫米）"]
    ,"Create a new customer and company account.": ["Create a new customer and company account.", "Yeni müşteri ve şirket hesabı oluşturun.", "创建新的客户和公司账户。"]
    ,"Edit customer and company information.": ["Edit customer and company information.", "Müşteri ve şirket bilgilerini düzenleyin.", "编辑客户和公司信息。"]
    ,"Edit manager profile information.": ["Edit manager profile information.", "Yönetici profil bilgilerini düzenleyin.", "编辑经理资料。"]
    ,"Edit your customer and company information.": ["Edit your customer and company information.", "Müşteri ve şirket bilgilerinizi düzenleyin.", "编辑您的客户和公司信息。"]
    ,"Change customer's password with verification.": ["Change customer's password with verification.", "Doğrulama ile müşteri parolasını değiştirin.", "通过验证修改客户密码。"]
    ,"Change manager password with verification.": ["Change manager password with verification.", "Doğrulama ile yönetici parolasını değiştirin.", "通过验证修改经理密码。"]
    ,"Change your password with verification.": ["Change your password with verification.", "Doğrulama ile parolanızı değiştirin.", "通过验证修改您的密码。"]
    ,"Reset your password with a verification code.": ["Reset your password with a verification code.", "Doğrulama koduyla parolanızı sıfırlayın.", "使用验证码重置密码。"]
    ,"Select which recently added products will be emailed to customers.": ["Select which recently added products will be emailed to customers.", "Müşterilere e-postayla gönderilecek yeni ürünleri seçin.", "选择要通过电子邮件发送给客户的新产品。"]
    ,"Update quantity and review price information.": ["Update quantity and review price information.", "Miktarı güncelleyin ve fiyat bilgisini kontrol edin.", "更新数量并检查价格信息。"]
    ,"Update selected product information.": ["Update selected product information.", "Seçili ürün bilgilerini güncelleyin.", "更新所选产品信息。"]
    ,"Loading customer...": ["Loading customer...", "Müşteri yükleniyor...", "正在加载客户..."]
    ,"Loading customers...": ["Loading customers...", "Müşteriler yükleniyor...", "正在加载客户..."]
    ,"Loading dashboard...": ["Loading dashboard...", "Gösterge paneli yükleniyor...", "正在加载仪表板..."]
    ,"Loading manager...": ["Loading manager...", "Yönetici yükleniyor...", "正在加载经理..."]
    ,"Loading orders...": ["Loading orders...", "Siparişler yükleniyor...", "正在加载订单..."]
    ,"Loading products...": ["Loading products...", "Ürünler yükleniyor...", "正在加载产品..."]
    ,"Search model, material, type...": ["Search model, material, type...", "Model, malzeme veya tür ara...", "搜索型号、材料或类型..."]
    ,"Düzenlemek için bir yönetici seçin.": ["Select a manager to edit.", "Düzenlemek için bir yönetici seçin.", "请选择要编辑的经理。"]
    ,"İşlem yapmak için sol menüden bir yönetici (Manager) seçin.": ["Select a manager from the left menu.", "İşlem yapmak için sol menüden bir yönetici seçin.", "请从左侧菜单选择经理。"]
    ,"Bu Manager'a Customer Ekle": ["Add Customer to This Manager", "Bu Yöneticiye Müşteri Ekle", "为该经理添加客户"]
    ,"Manager Silme / Customer Transferi": ["Delete Manager / Transfer Customers", "Yönetici Silme / Müşteri Transferi", "删除经理／转移客户"]
    ,"Manager'ı Sil": ["Delete Manager", "Yöneticiyi Sil", "删除经理"]
    ,"Customer'ları aktarılacak manager (opsiyonel)": ["Manager to receive customers (optional)", "Müşterilerin aktarılacağı yönetici (isteğe bağlı)", "接收客户的经理（可选）"]
    ,"Transfer yok": ["No transfer", "Transfer yok", "不转移"]
    ,"Bağlı customer varsa silmeden önce başka bir manager seçilmelidir.": ["If customers are assigned, select another manager before deletion.", "Bağlı müşteriler varsa silmeden önce başka bir yönetici seçilmelidir.", "如有关联客户，删除前必须选择另一位经理。"]
    ,"Yöneticiyi Sınırsız Güncelle": ["Update Manager (Unrestricted)", "Yöneticiyi Sınırsız Güncelle", "无限制更新经理"]
    ,"Müşteriyi Ez ve Kaydet": ["Overwrite and Save Customer", "Müşteriyi Ez ve Kaydet", "覆盖并保存客户"]
    ,"GOD MODE AKTİF": ["GOD MODE ACTIVE", "GOD MODE AKTİF", "上帝模式已启用"]
    ,"Hoş geldin,": ["Welcome,", "Hoş geldin,", "欢迎，"]
    ,"Yöneticiler (Managers)": ["Managers", "Yöneticiler", "经理"]
    ,"Parola (min. 12)": ["Password (min. 12)", "Parola (min. 12)", "密码（至少 12 位）"]
    ,"Yetkili Ad": ["Contact Name", "Yetkili Ad", "联系人名字"]
    ,"Yetkili Soyad": ["Contact Surname", "Yetkili Soyad", "联系人姓氏"]
    ,"İptal": ["Cancel", "İptal", "取消"]
    ,"Ad": ["Name", "Ad", "名字"]
    ,"Adres": ["Address", "Adres", "地址"]
    ,"Düzenle": ["Edit", "Düzenle", "编辑"]
    ,"Sil": ["Delete", "Sil", "删除"]
    ,"Soyad": ["Surname", "Soyad", "姓氏"]
    ,"Telefon": ["Phone", "Telefon", "电话"]
    ,"Ülke": ["Country", "Ülke", "国家"]
    ,"Şehir": ["City", "Şehir", "城市"]
    ,"Şirket": ["Company", "Şirket", "公司"]
    ,"Şirket Adı": ["Company Name", "Şirket Adı", "公司名称"]
    ,"Şirket Telefonu": ["Company Phone", "Şirket Telefonu", "公司电话"]
    ,"Kullanıcı Adı": ["Username", "Kullanıcı Adı", "用户名"]
    ,"Manager seç": ["Select Manager", "Yönetici seç", "选择经理"]
    ,"Email yok": ["No email", "E-posta yok", "无电子邮件"]
    ,"Yöneticiler yüklenemedi.": ["Managers could not be loaded.", "Yöneticiler yüklenemedi.", "无法加载经理。"]
    ,"Bu yöneticiye bağlı müşteri bulunamadı.": ["No customers are assigned to this manager.", "Bu yöneticiye bağlı müşteri bulunamadı.", "该经理没有关联客户。"]
    ,"Müşteriler yüklenirken hata oluştu.": ["Customers could not be loaded.", "Müşteriler yüklenirken hata oluştu.", "加载客户时出错。"]
    ,"Erişim Engellendi: Bu alana yalnızca Süper Yönetici erişebilir.": ["Access denied: only the superadmin can access this area.", "Erişim engellendi: Bu alana yalnızca Süper Yönetici erişebilir.", "拒绝访问：仅超级管理员可访问此区域。"]
    ,"Manager başarıyla oluşturuldu.": ["Manager created successfully.", "Yönetici başarıyla oluşturuldu.", "经理创建成功。"]
    ,"Customer başarıyla oluşturuldu.": ["Customer created successfully.", "Müşteri başarıyla oluşturuldu.", "客户创建成功。"]
    ,"Manager silinsin mi? Bu işlem geri alınamaz.": ["Delete this manager? This action cannot be undone.", "Yönetici silinsin mi? Bu işlem geri alınamaz.", "确定删除该经理吗？此操作无法撤销。"]
    ,"Başarıyla güncellendi": ["Updated successfully.", "Başarıyla güncellendi.", "更新成功。"]
    ,"Güncelleme hatası": ["Update failed.", "Güncelleme hatası.", "更新失败。"]
    ,"Transfer için bir manager seçin.": ["Select a manager for the transfer.", "Transfer için bir yönetici seçin.", "请选择接收转移的经理。"]
    ,"Customer başarıyla transfer edildi.": ["Customer transferred successfully.", "Müşteri başarıyla transfer edildi.", "客户转移成功。"]
    ,"Müşteri başarıyla güncellendi": ["Customer updated successfully.", "Müşteri başarıyla güncellendi.", "客户更新成功。"]
    ,"Sistemden çıkış yapmak istediğinize emin misiniz?": ["Are you sure you want to log out?", "Sistemden çıkış yapmak istediğinize emin misiniz?", "确定要退出系统吗？"]
    ,"Detailed customer order records": ["Detailed customer order records", "Detaylı müşteri sipariş kayıtları", "详细客户订单记录"]
    ,"Company Information": ["Company Information", "Şirket Bilgileri", "公司信息"]
    ,"Manager information": ["Manager information", "Yönetici bilgileri", "经理信息"]
    ,"Customer information": ["Customer information", "Müşteri bilgileri", "客户信息"]
    ,"Order Items": ["Order Items", "Sipariş Kalemleri", "订单项"]
    ,"No product selected yet.": ["No product selected yet.", "Henüz ürün seçilmedi.", "尚未选择产品。"]
    ,"No items in current order.": ["No items in current order.", "Aktif siparişte ürün yok.", "当前订单中没有商品。"]
    ,"Product added successfully.": ["Product added successfully.", "Ürün başarıyla eklendi.", "产品添加成功。"]
    ,"Product not found.": ["Product not found.", "Ürün bulunamadı.", "未找到产品。"]
    ,"Are you sure you want to delete this product?": ["Are you sure you want to delete this product?", "Bu ürünü silmek istediğinize emin misiniz?", "确定要删除该产品吗？"]
    ,"Product deleted successfully.": ["Product deleted successfully.", "Ürün başarıyla silindi.", "产品删除成功。"]
    ,"Are you sure you want to delete this customer?": ["Are you sure you want to delete this customer?", "Bu müşteriyi silmek istediğinize emin misiniz?", "确定要删除该客户吗？"]
    ,"Customer deleted successfully.": ["Customer deleted successfully.", "Müşteri başarıyla silindi.", "客户删除成功。"]
    ,"Creating customer...": ["Creating customer...", "Müşteri oluşturuluyor...", "正在创建客户..."]
    ,"Customer created successfully.": ["Customer created successfully.", "Müşteri oluşturuldu.", "客户创建成功。"]
    ,"Current order could not be loaded.": ["Current order could not be loaded.", "Aktif sipariş yüklenemedi.", "无法加载当前订单。"]
    ,"Order item not found.": ["Order item not found.", "Sipariş kalemi bulunamadı.", "未找到订单项。"]
    ,"Are you sure you want to delete this item?": ["Are you sure you want to delete this item?", "Bu kalemi silmek istediğinize emin misiniz?", "确定要删除该订单项吗？"]
    ,"Order item deleted successfully.": ["Order item deleted successfully.", "Sipariş kalemi başarıyla silindi.", "订单项删除成功。"]
    ,"Quantity must be greater than 0.": ["Quantity must be greater than 0.", "Miktar 0'dan büyük olmalıdır.", "数量必须大于 0。"]
    ,"Product added to order.": ["Product added to order.", "Ürün siparişe eklendi.", "产品已添加到订单。"]
    ,"No active order.": ["No active order.", "Aktif sipariş yok.", "没有当前订单。"]
    ,"You cannot complete an empty order.": ["You cannot complete an empty order.", "Boş sipariş tamamlanamaz.", "无法完成空订单。"]
    ,"Complete this order?": ["Complete this order?", "Bu sipariş tamamlansın mı?", "确定完成该订单吗？"]
    ,"Please select an order first.": ["Please select an order first.", "Önce bir sipariş seçin.", "请先选择订单。"]
    ,"Username and password are required.": ["Username and password are required.", "Kullanıcı adı ve parola zorunludur.", "用户名和密码为必填项。"]
    ,"Logging in...": ["Logging in...", "Giriş yapılıyor...", "正在登录..."]
    ,"Login successful. Redirecting...": ["Login successful. Redirecting...", "Giriş başarılı. Yönlendiriliyor...", "登录成功，正在跳转..."]
    ,"Login successful.": ["Login successful.", "Giriş başarılı.", "登录成功。"]
    ,"Unknown role. Cannot redirect.": ["Unknown role. Cannot redirect.", "Bilinmeyen rol. Yönlendirme yapılamadı.", "未知角色，无法跳转。"]
    ,"Requesting...": ["Requesting...", "İsteniyor...", "正在请求..."]
    ,"Manager session not found.": ["Manager session not found.", "Yönetici oturumu bulunamadı.", "未找到经理会话。"]
    ,"Enter 6-digit code": ["Enter 6-digit code", "6 haneli kodu girin", "输入 6 位验证码"]
    ,"Select an existing product suggestion or type product details manually.": ["Select an existing product suggestion or type product details manually.", "Mevcut bir ürün önerisini seçin veya ürün bilgilerini elle girin.", "请选择现有产品建议或手动输入产品信息。"]
    ,"Total:": ["Total:", "Toplam:", "总计："]
    ,"Every customer information or password change requires a verification code. The customer may choose email or SMS verification.": ["Every customer information or password change requires a verification code. The customer may choose email or SMS verification.", "Her müşteri bilgisi veya parola değişikliği için doğrulama kodu gerekir. Müşteri e-posta ya da SMS doğrulamasını seçebilir.", "每次修改客户信息或密码都需要验证码。客户可选择电子邮件或短信验证。"]
    ,"Every information or password change requires a verification code. You may choose email or SMS verification.": ["Every information or password change requires a verification code. You may choose email or SMS verification.", "Her bilgi veya parola değişikliği için doğrulama kodu gerekir. E-posta ya da SMS doğrulamasını seçebilirsiniz.", "每次修改信息或密码都需要验证码。您可以选择电子邮件或短信验证。"]
    ,"Every manager information or password change requires a verification code. You may choose email or SMS verification.": ["Every manager information or password change requires a verification code. You may choose email or SMS verification.", "Her yönetici bilgisi veya parola değişikliği için doğrulama kodu gerekir. E-posta ya da SMS doğrulamasını seçebilirsiniz.", "每次修改经理信息或密码都需要验证码。您可以选择电子邮件或短信验证。"]
    ,"Send verification code by Email": ["Send verification code by Email", "Doğrulama kodunu e-postayla gönder", "通过电子邮件发送验证码"]
    ,"Send verification code by SMS": ["Send verification code by SMS", "Doğrulama kodunu SMS ile gönder", "通过短信发送验证码"]
    ,"Send account information by Email": ["Send account information by Email", "Hesap bilgilerini e-postayla gönder", "通过电子邮件发送账户信息"]
    ,"Send account information by SMS": ["Send account information by SMS", "Hesap bilgilerini SMS ile gönder", "通过短信发送账户信息"]
    ,"Export Orders": ["Export Orders", "Siparişleri Dışa Aktar", "导出订单"]
    ,"Export Details": ["Export Details", "Detayları Dışa Aktar", "导出详情"]
    ,"Reset Password": ["Reset Password", "Parolayı Sıfırla", "重置密码"]
    ,"Send Updates": ["Send Updates", "Güncellemeleri Gönder", "发送更新"]
    ,"Type A → Z": ["Type A → Z", "Tür A → Z", "类型 A → Z"]
    ,"Type Z → A": ["Type Z → A", "Tür Z → A", "类型 Z → A"]
    ,"Previous": ["Previous", "Önceki", "上一页"]
    ,"Next": ["Next", "Sonraki", "下一页"]
    ,"Date": ["Date", "Tarih", "日期"]
    ,"Price": ["Price", "Fiyat", "价格"]
    ,"Order": ["Order", "Sipariş", "订单"]
    ,"Admin": ["Admin", "Admin", "管理员"]
    ,"Country calling code": ["Country calling code", "Ülke telefon kodu", "国家/地区代码"]
    ,"Phone number": ["Phone number", "Telefon numarası", "电话号码"]
    ,"Manager Silme / Veri Transferi": ["Delete Manager / Transfer Data", "Yönetici Silme / Veri Transferi", "删除经理／转移数据"]
    ,"Bağlı customer veya ürün varsa silmeden önce başka bir manager seçilmelidir.": ["If customers or products are assigned, select another manager before deletion.", "Bağlı müşteri veya ürün varsa silmeden önce başka bir yönetici seçilmelidir.", "如有关联客户或产品，删除前必须选择另一位经理。"]
    ,"Customer ve ürünlerin aktarılacağı manager (opsiyonel)": ["Manager to receive customers and products (optional)", "Müşteri ve ürünlerin aktarılacağı yönetici (isteğe bağlı)", "接收客户和产品的经理（可选）"]
    ,"Verification email could not be sent. Check the recipient address and SMTP logs.": ["Verification email could not be sent. Check the recipient address and SMTP logs.", "Doğrulama e-postası gönderilemedi. Alıcı adresini ve SMTP kayıtlarını kontrol edin.", "无法发送验证邮件。请检查收件人地址和 SMTP 日志。"]
    ,"Import Excel": ["Import Excel", "Excel'den İçe Aktar", "导入 Excel"]
    ,"Importing...": ["Importing...", "İçe aktarılıyor...", "正在导入..."]
    ,"Excel Import Result": ["Excel Import Result", "Excel İçe Aktarma Sonucu", "Excel 导入结果"]
    ,"Download Import Report": ["Download Import Report", "İçe Aktarma Raporunu İndir", "下载导入报告"]
    ,"Reading and validating Excel rows...": ["Reading and validating Excel rows...", "Excel satırları okunuyor ve doğrulanıyor...", "正在读取并验证 Excel 行..."]
    ,"Only .xlsx files can be imported.": ["Only .xlsx files can be imported.", "Yalnızca .xlsx dosyaları içe aktarılabilir.", "只能导入 .xlsx 文件。"]
    ,"Excel file must be smaller than 10 MB.": ["Excel file must be smaller than 10 MB.", "Excel dosyası 10 MB'den küçük olmalıdır.", "Excel 文件必须小于 10 MB。"]
    ,"Excel file could not be read.": ["Excel file could not be read.", "Excel dosyası okunamadı.", "无法读取 Excel 文件。"]
  };

  const patterns = [
    [/^Yönetici: (.+)$/u, ["Manager: $1", "Yönetici: $1", "经理：$1"]],
    [/^(.+) silinsin mi\? Siparişleri de silinir\.$/u, ["Delete $1? Its orders will also be deleted.", "$1 silinsin mi? Siparişleri de silinir.", "确定删除 $1 吗？其订单也会被删除。"]],
    [/^(.+) seçilen manager'a aktarılsın mı\?$/u, ["Transfer $1 to the selected manager?", "$1 seçilen yöneticiye aktarılsın mı?", "将 $1 转移给所选经理吗？"]],
    [/^Order completed: (.+)$/u, ["Order completed: $1", "Sipariş tamamlandı: $1", "订单已完成：$1"]],
    [/^(\d+) orders found\.$/u, ["$1 orders found.", "$1 sipariş bulundu.", "找到 $1 个订单。"]],
    [/^(\d+) of (\d+) orders shown\.$/u, ["$1 of $2 orders shown.", "$2 siparişin $1 tanesi gösteriliyor.", "显示 $2 个订单中的 $1 个。"]],
    [/^Showing (\d+)-(\d+) of (\d+) products$/u, ["Showing $1-$2 of $3 products", "$3 ürünün $1-$2 arası gösteriliyor", "显示第 $1-$2 个产品，共 $3 个"]],
    [/^Showing (\d+)-(\d+) of (\d+) customers$/u, ["Showing $1-$2 of $3 customers", "$3 müşterinin $1-$2 arası gösteriliyor", "显示第 $1-$2 个客户，共 $3 个"]]
    ,[/^Import products from (.+)\?$/u, ["Import products from $1?", "$1 dosyasındaki ürünler içe aktarılsın mı?", "从 $1 导入产品吗？"]]
    ,[/^(\d+) rows processed: (\d+) imported, (\d+) failed\.$/u, ["$1 rows processed: $2 imported, $3 failed.", "$1 satır işlendi: $2 içe aktarıldı, $3 başarısız.", "已处理 $1 行：成功导入 $2 行，失败 $3 行。"]]
  ];

  const sourceText = new WeakMap();
  const sourceAttributes = new WeakMap();
  let isChangingLanguage = false;
  let language = supported.includes(localStorage.getItem(STORAGE_KEY))
    ? localStorage.getItem(STORAGE_KEY)
    : "en";
  const sourceDocumentTitle = document.title;

  function translate(value) {
    const normalized = String(value || "").trim();
    const entry = translations[normalized];
    if (entry) return entry[supported.indexOf(language)];

    for (const [pattern, variants] of patterns) {
      const match = normalized.match(pattern);
      if (!match) continue;
      return variants[supported.indexOf(language)].replace(/\$(\d+)/g, (_, index) => match[Number(index)] || "");
    }
    return value;
  }

  function translateTextNode(node) {
    if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) return;
    const current = node.textContent.trim();
    if (!sourceText.has(node)) {
      sourceText.set(node, current);
    } else if (
      !isChangingLanguage &&
      current !== String(translate(sourceText.get(node))).trim()
    ) {
      sourceText.set(node, current);
    }
    const original = sourceText.get(node);
    const translated = translate(original);
    const leading = node.textContent.match(/^\s*/)?.[0] || "";
    const trailing = node.textContent.match(/\s*$/)?.[0] || "";
    const nextText = `${leading}${translated}${trailing}`;
    if (node.textContent !== nextText) node.textContent = nextText;
  }

  function translateElement(element) {
    if (!(element instanceof Element)) return;
    for (const attribute of ["placeholder", "title", "aria-label"]) {
      if (!element.hasAttribute(attribute)) continue;
      let originals = sourceAttributes.get(element);
      if (!originals) { originals = {}; sourceAttributes.set(element, originals); }
      if (!(attribute in originals)) originals[attribute] = element.getAttribute(attribute);
      element.setAttribute(attribute, translate(originals[attribute]));
    }

    element.childNodes.forEach(translateTextNode);
  }

  function applyTranslations(root = document.body) {
    if (!root) return;
    if (root instanceof Element) translateElement(root);
    root.querySelectorAll?.("*").forEach(translateElement);
    document.documentElement.lang = language === "zh" ? "zh-CN" : language;
    if (sourceDocumentTitle) document.title = translate(sourceDocumentTitle);
  }

  const nativeAlert = window.alert.bind(window);
  const nativeConfirm = window.confirm.bind(window);
  window.alert = (message) => nativeAlert(translate(message));
  window.confirm = (message) => nativeConfirm(translate(message));
  window.I18n = Object.freeze({
    t: translate,
    getLanguage: () => language,
    apply: applyTranslations
  });

  function createSelector() {
    const wrapper = document.createElement("label");
    wrapper.className = "language-selector";
    wrapper.textContent = `${translate("Language")}: `;
    const select = document.createElement("select");
    select.setAttribute("aria-label", "Language");
    for (const [value, label] of [["en", "English"], ["tr", "Türkçe"], ["zh", "中文"]]) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = value === language;
      select.append(option);
    }
    select.addEventListener("change", () => {
      language = select.value;
      localStorage.setItem(STORAGE_KEY, language);
      isChangingLanguage = true;
      try {
        applyTranslations();
        wrapper.firstChild.textContent = `${translate("Language")}: `;
      } finally {
        isChangingLanguage = false;
      }
    });
    wrapper.append(select);
    const logoutButton = document.getElementById("logoutBtn") || document.getElementById("btnLogout");
    if (logoutButton?.parentElement) {
      const stack = document.createElement("div");
      stack.className = "logout-language-stack";
      logoutButton.parentElement.insertBefore(stack, logoutButton);
      stack.append(logoutButton, wrapper);
    } else {
      wrapper.classList.add("standalone");
      document.body.append(wrapper);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    createSelector();
    applyTranslations();
    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) applyTranslations(node);
          else if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
        });
        if (mutation.type === "characterData") translateTextNode(mutation.target);
      }
    }).observe(document.body, { childList: true, characterData: true, subtree: true });
  });
})();
