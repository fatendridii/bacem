const PlanificationSession = require("../../Models/planificationSession");
const Trainer = require("../../Models/trainer");
const SessionPrivee = require("../../Models/sessionPrivee");
const calendar = require('./googleAuth');

exports.createPlanificationSession = async (req, res) => {
  const { trainerId, sessionId, proposedDates } = req.body;
  try {
    const updatedProposedDates = proposedDates.map((dateObj) => ({
      date: new Date(dateObj.date),
      time: dateObj.time || "10:00",
    }));

    const newPlanification = new PlanificationSession({
      trainer: trainerId,
      session: sessionId,
      proposedDates: updatedProposedDates,
    });

    await newPlanification.save();

    const session = await SessionPrivee.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session non trouvée" });
    }

    session.planificationSession.push(newPlanification._id);
    await session.save();

    res.status(201).json(newPlanification);
  } catch (error) {
    console.error("Erreur lors de la proposition des dates:", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la proposition des dates", error });
  }
};
exports.addselectedDate = async (req, res) => {
  try {
    const updatedPlanificationSession = {
      selectedDate: req.body.selectedDate,
    };
    const planificationSession = await PlanificationSession.findByIdAndUpdate(
      req.params.id,
      updatedPlanificationSession,
      {
        new: true,
      }
    );

    if (!planificationSession) {
      return res
        .status(404)
        .json({ message: "planificationSession not found" });
    }

    res.json(planificationSession);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.createMeetForPlanification = async (req, res) => {
  try {
    const { id } = req.params;
    const planificationSession = await PlanificationSession.findById(id);
    if (!planificationSession) {
      return res.status(404).json({ message: 'PlanificationSession non trouvée' });
    }

    const selectedDate = planificationSession.selectedDate;
    if (!selectedDate) {
      return res.status(400).json({ message: 'Date sélectionnée manquante dans la session de planification' });
    }

    const event = {
      summary: 'Session de Planification',
      description: 'Réunion Google Meet pour la session de planification',
      start: {
        dateTime: new Date(selectedDate).toISOString(),
        timeZone: 'Africa/Tunis',
      },
      end: {
        dateTime: new Date(new Date(selectedDate).getTime() + 60 * 60 * 1000).toISOString(), 
        timeZone: 'Africa/Tunis',
      },
      conferenceData: {
        createRequest: {
          requestId: Math.random().toString(36).substring(2, 15),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    const createdEvent = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
    });

    const meetLink = createdEvent.data.hangoutLink;
    const updatedSessionWithMeet = await PlanificationSession.findByIdAndUpdate(
      id,
      { meetLink: meetLink },
      { new: true }
    );

    res.json(updatedSessionWithMeet);
  } catch (error) {
    console.error('Erreur lors de la création de la réunion pour la planification:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la réunion pour la planification', error });
  }
};
