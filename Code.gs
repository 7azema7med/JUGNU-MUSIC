// Student Management Dashboard - Main Code
// تم التطوير بواسطة حازم احمد

// Configuration - Replace with your actual spreadsheet ID
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Replace with your Google Sheets ID
const SHEET_NAME = 'Sheet1';

// Admin credentials - In production, use PropertiesService for security
const ADMIN_CREDENTIALS = {
  'admin': 'admin123',
  'hazem': 'hazem123'
};

/**
 * Serves the HTML page
 */
function doGet(e) {
  const page = e.parameter.page || 'login';
  
  switch(page) {
    case 'login':
      return HtmlService.createTemplateFromFile('login')
        .evaluate()
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    case 'dashboard':
      return HtmlService.createTemplateFromFile('dashboard')
        .evaluate()
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    case 'admin':
      return HtmlService.createTemplateFromFile('admin')
        .evaluate()
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    default:
      return HtmlService.createTemplateFromFile('login')
        .evaluate()
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

/**
 * Include HTML files
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Authenticate admin user
 */
function authenticateAdmin(username, password) {
  try {
    if (ADMIN_CREDENTIALS[username] && ADMIN_CREDENTIALS[username] === password) {
      return { success: true, message: 'تم تسجيل الدخول بنجاح' };
    } else {
      return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
    }
  } catch (error) {
    return { success: false, message: 'حدث خطأ أثناء تسجيل الدخول' };
  }
}

/**
 * Add new admin user
 */
function addNewAdmin(currentUsername, currentPassword, newUsername, newPassword) {
  try {
    // Verify current admin credentials
    if (!ADMIN_CREDENTIALS[currentUsername] || ADMIN_CREDENTIALS[currentUsername] !== currentPassword) {
      return { success: false, message: 'بيانات الادمن الحالي غير صحيحة' };
    }
    
    // Check if new username already exists
    if (ADMIN_CREDENTIALS[newUsername]) {
      return { success: false, message: 'اسم المستخدم موجود بالفعل' };
    }
    
    // Add new admin (in production, save to PropertiesService)
    ADMIN_CREDENTIALS[newUsername] = newPassword;
    
    return { success: true, message: 'تم إضافة الادمن الجديد بنجاح' };
  } catch (error) {
    return { success: false, message: 'حدث خطأ أثناء إضافة الادمن الجديد' };
  }
}

/**
 * Get spreadsheet data with proper column mapping
 */
function getSpreadsheetData() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return { success: false, message: 'لم يتم العثور على الورقة المحددة' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return { success: true, data: [], headers: [] };
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    // Map the data according to your Excel structure
    const mappedRows = rows.map((row, index) => ({
      rowIndex: index,
      email: row[1] || '',           // Column B
      name: row[2] || '',            // Column C
      whatsapp: row[3] || '',        // Column D
      id: row[4] || '',              // Column E
      invoice: row[5] || '',         // Column F
      invoiceImage: row[6] || '',    // Column G
      status: row[8] || '',          // Column I
      notes: row[9] || '',           // Column J
      adminSignature: row[10] || ''  // Column K
    }));
    
    return { success: true, data: mappedRows, headers: headers };
  } catch (error) {
    Logger.log('Error getting spreadsheet data: ' + error.toString());
    return { success: false, message: 'حدث خطأ أثناء جلب البيانات: ' + error.toString() };
  }
}

/**
 * Search for student data with enhanced search capabilities
 */
function searchStudent(searchTerm, searchType) {
  try {
    const result = getSpreadsheetData();
    if (!result.success) {
      return result;
    }
    
    const data = result.data;
    
    if (data.length === 0) {
      return { success: true, data: [], message: 'لا توجد بيانات للبحث فيها' };
    }
    
    const searchTermLower = searchTerm.toLowerCase().trim();
    
    const filteredData = data.filter(student => {
      switch(searchType) {
        case 'email':
          return student.email.toLowerCase().includes(searchTermLower);
        case 'name':
          return student.name.toLowerCase().includes(searchTermLower);
        case 'whatsapp':
          return student.whatsapp.toLowerCase().includes(searchTermLower);
        case 'id':
          return student.id.toLowerCase().includes(searchTermLower);
        case 'invoice':
          return student.invoice.toLowerCase().includes(searchTermLower);
        case 'all':
        default:
          return (
            student.email.toLowerCase().includes(searchTermLower) ||
            student.name.toLowerCase().includes(searchTermLower) ||
            student.whatsapp.toLowerCase().includes(searchTermLower) ||
            student.id.toLowerCase().includes(searchTermLower) ||
            student.invoice.toLowerCase().includes(searchTermLower)
          );
      }
    });
    
    return { 
      success: true, 
      data: filteredData, 
      count: filteredData.length 
    };
  } catch (error) {
    Logger.log('Error searching student: ' + error.toString());
    return { success: false, message: 'حدث خطأ أثناء البحث: ' + error.toString() };
  }
}

/**
 * Update student data with proper column mapping
 */
function updateStudentData(rowIndex, updatedData, adminSignature) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return { success: false, message: 'لم يتم العثور على الورقة المحددة' };
    }
    
    // Add admin signature and timestamp
    const currentTime = new Date();
    const timestamp = Utilities.formatDate(currentTime, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    const fullSignature = `${adminSignature} - ${timestamp}`;
    
    // Update the row (rowIndex is 0-based, but sheet rows are 1-based, and we skip header)
    const actualRowIndex = rowIndex + 2; // +1 for header, +1 for 0-based to 1-based
    
    // Update according to your Excel structure:
    // B = Email, C = Name, D = WhatsApp, E = ID, F = Invoice, I = Status, J = Notes, K = Admin Signature
    if (updatedData.email !== undefined) sheet.getRange(actualRowIndex, 2).setValue(updatedData.email);
    if (updatedData.name !== undefined) sheet.getRange(actualRowIndex, 3).setValue(updatedData.name);
    if (updatedData.whatsapp !== undefined) sheet.getRange(actualRowIndex, 4).setValue(updatedData.whatsapp);
    if (updatedData.id !== undefined) sheet.getRange(actualRowIndex, 5).setValue(updatedData.id);
    if (updatedData.invoice !== undefined) sheet.getRange(actualRowIndex, 6).setValue(updatedData.invoice);
    if (updatedData.status !== undefined) sheet.getRange(actualRowIndex, 9).setValue(updatedData.status);
    if (updatedData.notes !== undefined) sheet.getRange(actualRowIndex, 10).setValue(updatedData.notes);
    
    // Always update admin signature when any change is made
    sheet.getRange(actualRowIndex, 11).setValue(fullSignature);
    
    return { success: true, message: 'تم تحديث البيانات بنجاح' };
  } catch (error) {
    Logger.log('Error updating student data: ' + error.toString());
    return { success: false, message: 'حدث خطأ أثناء تحديث البيانات: ' + error.toString() };
  }
}

/**
 * Get all students data for dashboard
 */
function getAllStudents() {
  try {
    const result = getSpreadsheetData();
    if (!result.success) {
      return result;
    }
    
    return { 
      success: true, 
      data: result.data, 
      total: result.data.length
    };
  } catch (error) {
    Logger.log('Error getting all students: ' + error.toString());
    return { success: false, message: 'حدث خطأ أثناء جلب البيانات: ' + error.toString() };
  }
}

/**
 * Get dashboard statistics
 */
function getDashboardStats() {
  try {
    const result = getSpreadsheetData();
    if (!result.success) {
      return result;
    }
    
    const data = result.data;
    
    const stats = {
      total: data.length,
      added: 0,
      pending: 0,
      withNotes: 0,
      withInvoiceImage: 0
    };
    
    data.forEach(student => {
      // Check status
      const status = student.status.toLowerCase();
      if (status.includes('تم الاضافة') || status.includes('✅')) {
        stats.added++;
      } else if (status.includes('لم يتم') || status.includes('❌')) {
        stats.pending++;
      }
      
      // Check notes
      if (student.notes && student.notes.toString().trim() !== '') {
        stats.withNotes++;
      }
      
      // Check invoice image
      if (student.invoiceImage && student.invoiceImage.toString().trim() !== '') {
        stats.withInvoiceImage++;
      }
    });
    
    return { success: true, stats: stats };
  } catch (error) {
    Logger.log('Error getting dashboard stats: ' + error.toString());
    return { success: false, message: 'حدث خطأ أثناء جلب الإحصائيات: ' + error.toString() };
  }
}

/**
 * Get student by specific field
 */
function getStudentByField(fieldValue, fieldType) {
  try {
    const result = getSpreadsheetData();
    if (!result.success) {
      return result;
    }
    
    const data = result.data;
    const student = data.find(s => {
      switch(fieldType) {
        case 'email': return s.email === fieldValue;
        case 'id': return s.id === fieldValue;
        case 'whatsapp': return s.whatsapp === fieldValue;
        case 'invoice': return s.invoice === fieldValue;
        default: return false;
      }
    });
    
    if (student) {
      return { success: true, data: student };
    } else {
      return { success: false, message: 'لم يتم العثور على الطالب' };
    }
  } catch (error) {
    Logger.log('Error getting student by field: ' + error.toString());
    return { success: false, message: 'حدث خطأ أثناء البحث عن الطالب: ' + error.toString() };
  }
}

/**
 * Initialize spreadsheet headers if needed
 */
function initializeSpreadsheet() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet(SHEET_NAME);
    }
    
    // Check if headers exist
    const range = sheet.getRange(1, 1, 1, 11);
    const headers = range.getValues()[0];
    
    if (!headers[1]) { // If column B is empty, set up headers
      const headerRow = [
        'A', // Column A
        'عنوان البريد الإلكتروني', // Column B
        'اسمك باللغة العربية (رباعي)', // Column C
        'WhatsApp Number', // Column D
        'كودك (ID)', // Column E
        'رقم التسجيل الفاتورة', // Column F
        'صورة الفاتورة', // Column G
        'H', // Column H
        'حالة الاضافة', // Column I
        'ملاحظات الادمن', // Column J
        'توقيع الادمن' // Column K
      ];
      
      sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
      
      // Format headers
      const headerRange = sheet.getRange(1, 1, 1, headerRow.length);
      headerRange.setBackground('#667eea');
      headerRange.setFontColor('white');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
    }
    
    return { success: true, message: 'تم تهيئة الجدول بنجاح' };
  } catch (error) {
    Logger.log('Error initializing spreadsheet: ' + error.toString());
    return { success: false, message: 'حدث خطأ أثناء تهيئة الجدول: ' + error.toString() };
  }
}