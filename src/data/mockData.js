// Dati mock per testing senza database
export const mockUsers = [
  {
    _id: '507f1f77bcf86cd799439011',
    username: 'admin',
    role: 'superadmin',
    location: null
  },
  {
    _id: '507f1f77bcf86cd799439012',
    username: 'cancano',
    role: 'admin',
    location: '507f1f77bcf86cd799439021'
  }
];

export const mockLocations = [
  {
    _id: '507f1f77bcf86cd799439021',
    name: 'Cancano',
    code: 'cancano'
  },
  {
    _id: '507f1f77bcf86cd799439022',
    name: 'Arnoga',
    code: 'arnoga'
  }
];

export const mockBikes = [
  {
    _id: '507f1f77bcf86cd799439031',
    name: 'E-Bike 1',
    barcode: 'BIKE001',
    type: 'ebike-full',
    priceHourly: 10,
    priceDaily: 60,
    status: 'available',
    location: '507f1f77bcf86cd799439021'
  },
  {
    _id: '507f1f77bcf86cd799439032',
    name: 'E-Bike 2',
    barcode: 'BIKE002',
    type: 'ebike-front',
    priceHourly: 8,
    priceDaily: 48,
    status: 'in-use',
    location: '507f1f77bcf86cd799439021'
  }
];

export const mockAccessories = [
  {
    _id: '507f1f77bcf86cd799439041',
    name: 'Casco',
    barcode: 'ACC001',
    priceHourly: 2,
    priceDaily: 8,
    status: 'available',
    location: '507f1f77bcf86cd799439021'
  }
];

export const mockContracts = [
  {
    _id: '507f1f77bcf86cd799439051',
    customer: {
      name: 'Mario Rossi',
      email: 'mario@example.com',
      phone: '123456789'
    },
    items: [
      {
        refId: '507f1f77bcf86cd799439032',
        kind: 'bike',
        name: 'E-Bike 2',
        barcode: 'BIKE002',
        priceHourly: 8,
        priceDaily: 48
      }
    ],
    status: 'in-use',
    startAt: new Date('2024-01-15T10:00:00Z'),
    location: '507f1f77bcf86cd799439021',
    totals: {
      subtotal: 48,
      grandTotal: 48
    },
    createdAt: new Date('2024-01-15T10:00:00Z')
  }
];