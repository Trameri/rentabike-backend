import mongoose from 'mongoose';
import Bike from './src/models/Bike.js';

mongoose.connect('mongodb://localhost:27017/rentabike');

const findDuplicates = async () => {
  try {
    const bikes = await Bike.find({ barcode: '01M' });
    console.log('Bici con barcode 01M:', bikes.length);
    bikes.forEach(bike => {
      console.log('ID:', bike._id, 'Nome:', bike.name, 'Barcode:', bike.barcode);
    });
    
    // Trova tutti i barcode duplicati
    const duplicates = await Bike.aggregate([
      { $group: { _id: '$barcode', count: { $sum: 1 }, docs: { $push: '$$ROOT' } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    
    console.log('Barcode duplicati trovati:', duplicates.length);
    duplicates.forEach(dup => {
      console.log('Barcode:', dup._id, 'Count:', dup.count);
      dup.docs.forEach(doc => {
        console.log('  - ID:', doc._id, 'Nome:', doc.name);
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Errore:', error);
    process.exit(1);
  }
};

findDuplicates();