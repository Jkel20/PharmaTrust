# Pharmacy Management System

A comprehensive web-based Pharmacy Management System built with Node.js, Express.js, and MongoDB. This system streamlines pharmacy operations including inventory management, sales tracking, prescription handling, and supplier management.

## 🏥 Features

### Core Modules
- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: CRUD operations for users with roles (admin, pharmacist, cashier)
- **Inventory Management**: Product tracking with stock levels, expiry dates, and reorder alerts
- **Sales Management**: Transaction recording with receipt generation
- **Prescription Management**: Doctor and patient information tracking with status management
- **Supplier Management**: Supplier information and credit tracking
- **Dashboard & Reporting**: Real-time analytics and report generation

### Security Features
- JWT Authentication with role-based access control
- Password hashing with bcryptjs
- Input validation and sanitization
- Rate limiting and CORS protection
- Helmet security headers

### Advanced Features
- Real-time stock alerts and expiry notifications
- Comprehensive reporting system
- Export functionality (JSON/CSV)
- API documentation with Swagger
- Pagination and search capabilities

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
   cp backend/.env.example backend/.env
   ```
   
   Edit `backend/.env` with your configuration:
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

5. **Access the API**
   - API Base URL: `http://localhost:5000`
   - API Documentation: `http://localhost:5000/api-docs`
   - Health Check: `http://localhost:5000/health`

## 📚 API Documentation

The API is fully documented with Swagger. Access the interactive documentation at:
`http://localhost:5000/api-docs`

### Authentication Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/update-profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh JWT token

### User Management
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

### Inventory Management
- `GET /api/products` - Get all products
- `POST /api/products` - Create new product
- `GET /api/products/:id` - Get product by ID
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/low-stock` - Get low stock products
- `GET /api/products/expiring` - Get expiring products

### Sales Management
- `GET /api/sales` - Get all sales
- `POST /api/sales` - Create new sale
- `GET /api/sales/:id` - Get sale by ID
- `PUT /api/sales/:id/void` - Void sale
- `GET /api/sales/reports/daily` - Daily sales report

### Prescription Management
- `GET /api/prescriptions` - Get all prescriptions
- `POST /api/prescriptions` - Create new prescription
- `GET /api/prescriptions/:id` - Get prescription by ID
- `PUT /api/prescriptions/:id` - Update prescription
- `POST /api/prescriptions/:id/dispense` - Dispense prescription

### Supplier Management
- `GET /api/suppliers` - Get all suppliers
- `POST /api/suppliers` - Create new supplier
- `GET /api/suppliers/:id` - Get supplier by ID
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Dashboard & Reports
- `GET /api/dashboard/overview` - Dashboard overview
- `GET /api/dashboard/sales-summary` - Sales summary
- `GET /api/dashboard/inventory-summary` - Inventory summary
- `GET /api/reports/sales` - Sales reports
- `GET /api/reports/inventory` - Inventory reports

## 🔐 Authentication & Authorization

### User Roles
- **Admin**: Full system access
- **Pharmacist**: Can manage prescriptions, inventory, and sales
- **Cashier**: Can process sales and view inventory

### JWT Token Usage
Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Permission System
The system uses a granular permission system:
- `canManageUsers` - Manage user accounts
- `canManageInventory` - Manage product inventory
- `canProcessSales` - Process sales transactions
- `canManagePrescriptions` - Manage prescriptions
- `canGenerateReports` - Generate reports
- `canManageSuppliers` - Manage suppliers

## 📊 Data Models

### User Model
```javascript
{
  firstName: String,
  lastName: String,
  email: String,
  username: String,
  password: String,
  phoneNumber: String,
  role: ['admin', 'pharmacist', 'cashier'],
  isActive: Boolean,
  permissions: Object,
  address: Object
}
```

### Product Model
```javascript
{
  name: String,
  description: String,
  category: String,
  sku: String,
  price: Number,
  costPrice: Number,
  quantity: Number,
  unit: String,
  reorderLevel: Number,
  expiryDate: Date,
  manufacturer: String,
  supplier: ObjectId,
  batchNumber: String,
  isPrescriptionRequired: Boolean
}
```

### Sale Model
```javascript
{
  saleNumber: String,
  customer: Object,
  items: Array,
  subtotal: Number,
  tax: Number,
  discount: Number,
  total: Number,
  paymentMethod: String,
  paymentStatus: String,
  cashier: ObjectId,
  receiptNumber: String
}
```

### Prescription Model
```javascript
{
  prescriptionNumber: String,
  patient: Object,
  doctor: Object,
  items: Array,
  diagnosis: String,
  prescribedDate: Date,
  expiryDate: Date,
  status: String,
  priority: String,
  pharmacist: ObjectId
}
```

## 🛠️ Development

### Project Structure
```
backend/
├── models/          # Mongoose models
├── routes/          # Express routes
├── middleware/      # Custom middleware
├── services/        # Business logic
├── server.js        # Main server file
└── .env.example     # Environment variables template
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

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🔧 Configuration

### Database Setup
1. Install MongoDB
2. Create a database named `pharmacy_management`
3. Update the `MONGODB_URI` in your `.env` file

### Security Configuration
- Generate a strong JWT secret
- Configure CORS origins for production
- Set up rate limiting parameters
- Configure email settings for notifications

## 📈 Monitoring & Logging

The system includes comprehensive logging:
- Request logging with Morgan
- Error logging and handling
- Database connection monitoring
- Performance monitoring

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure production MongoDB URI
- [ ] Set strong JWT secret
- [ ] Configure CORS for production domains
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (nginx)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategies

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the API documentation at `/api-docs`

## 🔮 Roadmap

### Phase 2 Features
- [ ] Real-time notifications with WebSocket
- [ ] Mobile app integration
- [ ] Advanced analytics dashboard
- [ ] Barcode scanning integration
- [ ] Multi-branch support
- [ ] Advanced reporting with charts
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Payment gateway integration
- [ ] Customer loyalty program

### Phase 3 Features
- [ ] AI-powered inventory optimization
- [ ] Predictive analytics
- [ ] Integration with healthcare systems
- [ ] Advanced security features
- [ ] Multi-language support
- [ ] Offline mode support

---

**Built with ❤️ for modern pharmacy management**