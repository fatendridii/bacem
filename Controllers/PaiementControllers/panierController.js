const Panier = require("../../Models/panier");
const Course = require("../../Models/course");

exports.addItemToCart = async (req, res) => {
  const { userId, courseId } = req.body;
  try {
    
    let panier = await Panier.findOne({ user: userId });

  
    if (!panier) {
      panier = new Panier({ user: userId, items: [], prixTotal: 0 });
    }

  
    const existingItemIndex = panier.items.findIndex(item => item.course.toString() === courseId.toString());

  
    if (existingItemIndex !== -1) {
      return res.status(400).json({ message: 'Le cours existe déjà dans votre panier' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    panier.items.push({ course: courseId, price: course.price });
    panier.prixTotal = panier.items.reduce((total, item) => total + item.price, 0);

    const updatedPanier = await panier.save();

    res.status(200).json(updatedPanier);
  } catch (error) {
   
    res.status(500).json({ message: 'Error adding course to cart', error: error.message });
  }
};
exports.getCartByUser = async (req, res) => {

    const { userId } = req.params;
    try {
          
        const panier = await Panier.findOne({ user: userId }).populate('items.course');
    
        if (!panier) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        res.status(200).json(panier);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error retrieving cart', error: error.message });
    }
};
exports.removeItemFromCart = async (req, res) => {
  const { userId, courseId } = req.body;
  try {
    let panier = await Panier.findOne({ user: userId });

    if (!panier) {
      return res.status(404).json({ message: 'Panier non trouvé' });
    }

    const existingItemIndex = panier.items.findIndex(item => item.course.toString() === courseId.toString());

    if (existingItemIndex === -1) {
      return res.status(404).json({ message: 'Le cours n\'existe pas dans votre panier' });
    }

  
    panier.items.splice(existingItemIndex, 1);

   
    panier.prixTotal = panier.items.reduce((total, item) => total + item.price, 0);

    
    const updatedPanier = await panier.save();

    res.status(200).json({ message: 'Cours supprimé du panier avec succès', updatedPanier });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du cours du panier', error: error.message });
  }
};

