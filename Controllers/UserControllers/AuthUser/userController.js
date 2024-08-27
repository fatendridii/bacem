const User = require('../../../Models/user');


exports.getUsersWithRoleClient = async (req, res) => {
  try {
    const clients = await User.find({ role: 'client' });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUsersWithRoleClientById = async (req, res) => {
  try {
    const client = await User.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'client not found' });
    }
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.getUsersWithRoleFormateur = async (req, res) => {
  try {
    const formateurs = await User.find({ role: 'formateur' });
    res.json(formateurs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.mostActiveUsers = async (req, res) => {
  try {
    const mostActiveUsers = await User.aggregate([
      {
        $project: {
          firstname: 1,
          lastname: 1,
          paiementsCount: { $cond: { if: { $isArray: '$paiements' }, then: { $size: '$paiements' }, else: 0 } },
          eventsCount: { $cond: { if: { $isArray: '$events' }, then: { $size: '$events' }, else: 0 } },
          sessionsCount: { $cond: { if: { $isArray: '$sessions' }, then: { $size: '$sessions' }, else: 0 } },
          reclamationsCount: { $cond: { if: { $isArray: '$reclamations' }, then: { $size: '$reclamations' }, else: 0 } },
          realisationsCount: { $cond: { if: { $isArray: '$realisations' }, then: { $size: '$realisations' }, else: 0 } },
          certificatesCount: { $cond: { if: { $isArray: '$certificates' }, then: { $size: '$certificates' }, else: 0 } },
        },
      },
      {
        $addFields: {
          totalActivity: {
            $add: [
              '$paiementsCount',
              '$eventsCount',
              '$sessionsCount',
              '$reclamationsCount',
              '$realisationsCount',
              '$certificatesCount'
            ]
          }
        }
      },
      {
        $sort: {
          totalActivity: -1,
        },
      },
      {
        $limit: 5,
      },
    ]);

    res.json(mostActiveUsers);
  } catch (err) {
    console.error('Erreur lors de la récupération des utilisateurs les plus actifs :', err);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
};
