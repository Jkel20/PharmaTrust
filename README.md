# PharmaTrust - Comprehensive Pharmacy Management System

A full-featured, web-based Pharmacy Management System built with Node.js, Express.js, and MongoDB. Designed to streamline pharmacy operations including inventory management, sales tracking, prescription handling, and supplier management.

## 🚀 Features

### Core Functionality
- **User Management**: Role-based authentication (Admin, Pharmacist, Cashier)
- **Inventory Management**: Complete product lifecycle with batch tracking, expiry monitoring
- **Sales Management**: POS system with receipt generation, multiple payment methods
- **Prescription Management**: Digital prescription processing with patient tracking
- **Supplier Management**: Credit tracking, order management, delivery scheduling
- **Reporting & Analytics**: Sales reports, inventory valuation, low stock alerts

### Security & Performance
- JWT-based authentication with role-based access control
- Password hashing with bcrypt
- Rate limiting and input validation
- CORS protection and security headers
- Comprehensive error handling and logging

### API Features
- RESTful API design
- Swagger/OpenAPI documentation
- Pagination and filtering
- Search functionality
- Data validation and sanitization

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, bcryptjs, express-rate-limit
- **Validation**: express-validator
- **Documentation**: Swagger UI
- **Logging**: Morgan

## 📁 Project Structure

```
pharmacy-management/
├── backend/
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT & role-based auth
│   │   └── validationMiddleware.js # Input validation
│   ├── models/
│   │   ├── User.js               # User schema with roles
│   │   ├── Product.js            # Product/inventory schema
│   │   ├── Sale.js               # Sales transaction schema
│   │   ├── Prescription.js       # Prescription schema
│   │   └── Supplier.js           # Supplier schema
│   ├── routes/
│   │   ├── auth.js               # Authentication routes
│   │   ├── users.js              # User management
│   │   ├── inventory.js          # Product/inventory management
│   │   ├── sales.js              # Sales transactions
│   │   ├── prescriptions.js      # Prescription management
│   │   ├── suppliers.js          # Supplier management
│   │   ├── reports.js            # Analytics and reports
│   │   └── dashboard.js          # Dashboard data
│   ├── services/
│   │   └── alertService.js       # Background alerts
│   └── server.js                 # Main server file
├── frontend/                     # Future React frontend
├── .env.example                  # Environment variables template
├── .env                          # Environment variables
├── package.json                  # Dependencies
└── README.md                     # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
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
   
   Edit `.env` with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/pharmacy_management
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=30d
   BCRYPT_SALT_ROUNDS=12
   ```

4. **Start the server**
   ```bash
   # Development mode with nodemon
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Access the API**
   - API Server: `http://localhost:5000`
   - API Documentation: `http://localhost:5000/api-docs`
   - Health Check: `http://localhost:5000/health`

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | User login | Public |
| GET | `/api/auth/me` | Get user profile | Private |
| PUT | `/api/auth/change-password` | Change password | Private |
| PUT | `/api/auth/update-profile` | Update profile | Private |
| POST | `/api/auth/logout` | Logout user | Private |
| GET | `/api/auth/validate-token` | Validate JWT token | Private |

### User Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/users` | Get all users | Admin/Pharmacist |
| GET | `/api/users/:id` | Get user by ID | Admin/Pharmacist |
| POST | `/api/users` | Create new user | Admin |
| PUT | `/api/users/:id` | Update user | Admin |
| PUT | `/api/users/:id/activate` | Activate/deactivate user | Admin |
| PUT | `/api/users/:id/reset-password` | Reset user password | Admin |
| DELETE | `/api/users/:id` | Delete user | Admin |

### Inventory Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/inventory` | Get all products | All roles |
| GET | `/api/inventory/:id` | Get product by ID | All roles |
| POST | `/api/inventory` | Add new product | Admin/Pharmacist |
| PUT | `/api/inventory/:id` | Update product | Admin/Pharmacist |
| PUT | `/api/inventory/:id/adjust-stock` | Adjust stock quantity | Admin/Pharmacist |
| GET | `/api/inventory/reports/low-stock` | Get low stock products | All roles |
| GET | `/api/inventory/reports/expiring` | Get expiring products | All roles |
| GET | `/api/inventory/reports/expired` | Get expired products | All roles |
| GET | `/api/inventory/reports/valuation` | Get inventory valuation | Admin/Pharmacist |
| GET | `/api/inventory/search/barcode` | Search by barcode/SKU | All roles |

### Sales Management

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/sales` | Get all sales | All roles |
| GET | `/api/sales/:id` | Get sale by ID | All roles |
| POST | `/api/sales` | Create new sale | All roles |
| PUT | `/api/sales/:id/refund` | Process refund | Admin/Pharmacist |
| GET | `/api/sales/reports/analytics` | Get sales analytics | Admin/Pharmacist |
| GET | `/api/sales/reports/top-products` | Get top selling products | Admin/Pharmacist |

## 🔒 Authentication & Authorization

### User Roles
- **Admin**: Full system access, user management, all operations
- **Pharmacist**: Inventory management, prescription handling, sales oversight
- **Cashier**: Sales transactions, basic inventory viewing

### JWT Token Structure
```json
{
  "id": "user_id",
  "email": "user@example.com", 
  "role": "pharmacist",
  "fullName": "John Doe"
}
```

### Protected Routes
All API endpoints except authentication require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## 📊 Data Models

### User Model
```javascript
{
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  phoneNumber: String,
  role: ['admin', 'pharmacist', 'cashier'],
  isActive: Boolean,
  lastLogin: Date,
  address: Object,
  emergencyContact: Object,
  employeeDetails: Object
}
```

### Product Model
```javascript
{
  name: String,
  genericName: String,
  category: String,
  manufacturer: String,
  supplier: ObjectId (ref: Supplier),
  batchNumber: String,
  quantity: Number,
  unitPrice: Number,
  sellingPrice: Number,
  expiryDate: Date,
  reorderLevel: Number,
  requiresPrescription: Boolean,
  location: Object,
  isActive: Boolean
}
```

### Sale Model
```javascript
{
  saleNumber: String (unique),
  items: [Product items with quantities],
  customer: Object,
  prescription: ObjectId (ref: Prescription),
  subtotal: Number,
  totalAmount: Number,
  payment: Object,
  saleType: ['prescription', 'over_counter', 'wholesale'],
  status: String,
  soldBy: ObjectId (ref: User)
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRE` | JWT expiration time | 30d |
| `BCRYPT_SALT_ROUNDS` | Password hashing rounds | 12 |
| `RATE_LIMIT_WINDOW_MS` | Rate limiting window | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

### MongoDB Setup

#### Local MongoDB
```bash
# Install MongoDB
# Start MongoDB service
mongod --dbpath /data/db
```

#### MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create cluster and database
3. Get connection string and add to `.env`

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📈 Monitoring & Logging

### Health Check
```
GET /health
```
Returns server status, uptime, and environment information.

### Logging
- Development: Console logging with morgan 'dev' format
- Production: Combined logging format
- Error logging for debugging

### Rate Limiting
- 100 requests per 15 minutes per IP
- Configurable via environment variables

## 🧪 Testing

### API Testing with Postman
1. Import the API endpoints from Swagger documentation
2. Set up environment variables for base URL and auth token
3. Test all endpoints with different user roles

### Manual Testing
```bash
# Register admin user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Admin",
    "lastName": "User", 
    "email": "admin@pharmacy.com",
    "password": "AdminPass123!",
    "phoneNumber": "+1234567890",
    "role": "admin"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pharmacy.com",
    "password": "AdminPass123!"
  }'
```

## 🔄 Future Enhancements

### Frontend Development
- React.js dashboard for pharmacy management
- Real-time inventory updates
- Point of sale interface
- Mobile app for inventory checking

### Advanced Features
- Barcode scanning integration
- Automatic reorder notifications
- Insurance claim processing
- Multi-location support
- Advanced analytics and reporting

### Integrations
- Payment gateway integration
- SMS/Email notifications
- Accounting software integration
- Government regulatory reporting

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the ISC License.

## 📞 Support

For support and questions:
- Email: support@pharmatrust.com
- GitHub Issues: [Create an issue](https://github.com/Jkel20/PharmaTrust/issues)

## 🙏 Acknowledgments

- Built for streamlining pharmacy operations in Ghana and developing regions
- Designed with best practices for healthcare data management
- Inspired by the need for digital transformation in pharmaceutical sector

---

**PharmaTrust** - Empowering pharmacies with modern technology for better healthcare delivery.