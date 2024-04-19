export default class Calcule {
    
    static calcule__total = (price, comission) => {
        if (price === "" || comission === "") {
          return "";
        }
        const total =
          parseFloat(price) + (parseFloat(price) * parseFloat(comission)) / 100;
        return total;
      };
    
    
}