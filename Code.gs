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
 * Get spreadsheet data
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
    
    return { success: true, data: rows, headers: headers };
  } catch (error) {
    Logger.log('Error getting spreadsheet data: ' + error.toString());
    return { success: false, message: 'حدث خطأ أثناء جلب البيانات: ' + error.toString() };
  }
}

/**
 * Search for student data
 */
function searchStudent(searchTerm, searchType) {
  try {
    const result = getSpreadsheetData();
    if (!result.success) {
      return result;
    }
    
    const data = result.data;
    const headers = result.headers;
    
    if (data.length === 0) {
      return { success: true, data: [], message: 'لا توجد بيانات للبحث فيها' };
    }
    
    // Column mapping based on your requirements
    const columnMap = {
      'email': 1,        // B column (index 1)
      'name': 2,         // C column (index 2)  
      'whatsapp': 3,     // D column (index 3)
      'id': 4,           // E column (index 4)
      'invoice': 5,      // F column (index 5)
      'all': -1          // Search in all columns
    };
    
    const searchColumn = columnMap[searchType] || -1;
    const searchTermLower = searchTerm.toLowerCase().trim();
    
    const filteredData = data.filter((row, index) => {
      if (searchColumn === -1) {
        // Search in all text columns (B, C, D, E, F)
        return [1, 2, 3, 4, 5].some(colIndex => {
          const cellValue = (row[colIndex] || '').toString().toLowerCase();
          return cellValue.includes(searchTermLower);
        });
      } else {
        const cellValue = (row[searchColumn] || '').toString().toLowerCase();
        return cellValue.includes(searchTermLower);
      }
    });
    
    return { 
      success: true, 
      data: filteredData, 
      headers: headers,
      count: filteredData.length 
    };
  } catch (error) {
    Logger.log('Error searching student: ' + error.toString());
    return { success: false, message: 'حدث خطأ أثناء البحث: ' + error.toString() };
  }
}

/**
 * Update student data
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
    
    // Update the row (rowIndex is 0-based, but sheet rows are 1-based, and we skip header)
    const actualRowIndex = rowIndex + 2; // +1 for header, +1 for 0-based to 1-based
    
    // Column mapping: B=2, C=3, D=4, E=5, F=6, G=7, I=9, J=10, K=11
    sheet.getRange(actualRowIndex, 2).setValue(updatedData.email || '');
    sheet.getRange(actualRowIndex, 3).setValue(updatedData.name || '');
    sheet.getRange(actualRowIndex, 4).setValue(updatedData.whatsapp || '');
    sheet.getRange(actualRowIndex, 5).setValue(updatedData.id || '');
    sheet.getRange(actualRowIndex, 6).setValue(updatedData.invoice || '');
    // Column G (7) is for image - not updating via text
    sheet.getRange(actualRowIndex, 9).setValue(updatedData.status || '');
    sheet.getRange(actualRowIndex, 10).setValue(updatedData.notes || '');
    sheet.getRange(actualRowIndex, 11).setValue(adminSignature + ' - ' + timestamp);
    
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
    
    const data = result.data;
    const headers = result.headers;
    
    // Add row indices for easier tracking
    const dataWithIndices = data.map((row, index) => ({
      rowIndex: index,
      data: row
    }));
    
    return { 
      success: true, 
      data: dataWithIndices, 
      headers: headers,
      total: data.length
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
      withNotes: 0
    };
    
    data.forEach(row => {
      // Column I (index 8) - Status
      const status = (row[8] || '').toString().toLowerCase();
      if (status.includes('تم الاضافة') || status.includes('✅')) {
        stats.added++;
      } else if (status.includes('لم يتم') || status.includes('❌')) {
        stats.pending++;
      }
      
      // Column J (index 9) - Notes
      if (row[9] && row[9].toString().trim() !== '') {
        stats.withNotes++;
      }
    });
    
    return { success: true, stats: stats };
  } catch (error) {
    Logger.log('Error getting dashboard stats: ' + error.toString());
    return { success: false, message: 'حدث خطأ أثناء جلب الإحصائيات: ' + error.toString() };
  }
}