# Pharmacy Management System

A comprehensive web-based Pharmacy Management System built with Node.js, Express.js, and MongoDB. This system streamlines pharmacy operations including inventory management, sales tracking, prescription handling, and supplier management.

## 🏥 Features

### Core Modules
- **Authentication & Authorization**: Role-based access control (Admin, Pharmacist, Cashier)
- **User Management**: Complete CRUD operations for pharmacy staff
- **Inventory Management**: Product tracking with stock levels, expiry dates, and reorder alerts
- **Sales Management**: Transaction recording with receipt generation
- **Prescription Management**: Digital prescription handling with status tracking
- **Supplier Management**: Supplier information and credit tracking
- **Dashboard & Reporting**: Real-time analytics and comprehensive reports

### Advanced Features
- **Security**: JWT authentication, password hashing, rate limiting, input validation
- **API Documentation**: Swagger/OpenAPI documentation
- **Real-time Alerts**: Low stock, expiry, and credit alerts
- **Export Functionality**: JSON/CSV report exports
- **Search & Filtering**: Advanced search and filtering capabilities
- **Pagination**: Efficient data pagination for large datasets

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Jkel20/PharmaTrust.git
   cd PharmaTrust
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/pharmacy_management
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=24h
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Access the application**
   - API Server: http://localhost:5000
   - API Documentation: http://localhost:5000/api-docs
   - Health Check: http://localhost:5000/health

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### User Management
- `GET /api/users` - Get all users (Admin only)
- `POST /api/users` - Create new user (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

### Inventory Management
- `GET /api/products` - Get all products with pagination
- `POST /api/products` - Create new product
- `GET /api/products/:id` - Get product by ID
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/low-stock` - Get low stock products
- `GET /api/products/expiring` - Get expiring products

### Sales Management
- `GET /api/sales` - Get all sales with pagination
- `POST /api/sales` - Create new sale
- `GET /api/sales/:id` - Get sale by ID
- `PUT /api/sales/:id` - Update sale
- `DELETE /api/sales/:id` - Cancel sale
- `GET /api/sales/receipt/:id` - Get sale receipt

### Prescription Management
- `GET /api/prescriptions` - Get all prescriptions
- `POST /api/prescriptions` - Create new prescription
- `GET /api/prescriptions/:id` - Get prescription by ID
- `PUT /api/prescriptions/:id` - Update prescription
- `POST /api/prescriptions/:id/dispense` - Dispense prescription
- `POST /api/prescriptions/:id/cancel` - Cancel prescription

### Supplier Management
- `GET /api/suppliers` - Get all suppliers
- `POST /api/suppliers` - Create new supplier
- `GET /api/suppliers/:id` - Get supplier by ID
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Dashboard & Reports
- `GET /api/dashboard/summary` - Get dashboard summary
- `GET /api/dashboard/sales` - Get sales analytics
- `GET /api/dashboard/inventory` - Get inventory analytics
- `GET /api/reports/sales` - Generate sales reports
- `GET /api/reports/inventory` - Generate inventory reports
- `GET /api/reports/expiry` - Generate expiry reports

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Admin, Pharmacist, Cashier roles
- **Password Hashing**: bcryptjs for secure password storage
- **Input Validation**: express-validator for request validation
- **Rate Limiting**: Protection against brute force attacks
- **CORS Protection**: Cross-origin resource sharing security
- **Helmet**: Security headers for Express.js

## 📊 Database Models

### User Model
- First name, last name, email, password
- Role-based access (admin, pharmacist, cashier)
- Phone number, profile image
- Active status and last login tracking

### Product Model
- Name, description, price, stock quantity
- Category, supplier, expiry date
- Reorder level, barcode, unit type
- Prescription requirement flag

### Sale Model
- Receipt number, products, customer info
- Payment method, discount, final amount
- Seller tracking, prescription linking
- Status management (completed, cancelled, refunded)

### Prescription Model
- Prescription number, patient and doctor info
- Medications with dosage and frequency
- Status tracking (pending, dispensed, cancelled)
- Dispensing user and timestamp

### Supplier Model
- Name, contact information, address
- Credit limit and current credit tracking
- Payment terms, notes
- Active status management

## 🛠️ Development

### Project Structure
```
backend/
├── models/          # Mongoose models
├── routes/          # Express routes
├── middleware/      # Custom middleware
├── services/        # Business logic
└── server.js        # Main server file
```

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (to be implemented)

### Environment Variables
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/pharmacy_management

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password

# API Documentation
API_DOCS_URL=/api-docs
```

## 🔧 Configuration

### MongoDB Setup
1. Install MongoDB locally or use MongoDB Atlas
2. Create a database named `pharmacy_management`
3. Update the `MONGODB_URI` in your `.env` file

### JWT Configuration
1. Generate a strong JWT secret
2. Update `JWT_SECRET` in your `.env` file
3. Configure `JWT_EXPIRE` as needed

### Rate Limiting
- Adjust `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS` based on your needs
- Default: 100 requests per 15 minutes

## 📈 Monitoring & Alerts

### Automated Alerts
- **Low Stock Alerts**: Products below reorder level
- **Expiry Alerts**: Products expiring within 30 days
- **Credit Alerts**: Suppliers approaching credit limits

### Report Generation
- **Daily Sales Reports**: Automated daily sales summaries
- **Inventory Reports**: Stock level and expiry reports
- **Supplier Reports**: Credit utilization reports

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the API documentation at `/api-docs`

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Core API development
- ✅ Authentication and authorization
- ✅ Basic CRUD operations
- ✅ Security implementation

### Phase 2 (Planned)
- 🔄 Frontend development (React/Vue.js)
- 🔄 Real-time notifications
- 🔄 Advanced reporting
- 🔄 Mobile app integration

### Phase 3 (Future)
- 📋 Advanced analytics
- 📋 Integration with external APIs
- 📋 Multi-branch support
- 📋 Advanced inventory forecasting

---

**Built with ❤️ for the pharmaceutical industry**