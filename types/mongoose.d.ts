declare module 'mongoose' {
  import { ObjectId } from 'mongodb';
  export { ObjectId };
  
  namespace Types {
    class ObjectId {
      constructor(id?: string | ObjectId | number);
      toString(): string;
      equals(otherId: string | ObjectId | number): boolean;
      toHexString(): string;
    }
  }
  
  // Add more type definitions as needed
  export default mongoose;
}