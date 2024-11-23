// class ClaudeController {
//     constructor(claudeService) {
//         this.claudeService = claudeService;
//     }

//     async getClaudeData(req, res) {
//         try {
//             const data = await this.claudeService.fetchData();
//             res.status(200).json(data);
//         } catch (error) {
//             res.status(500).json({ error: error.message });
//         }
//     }

//     async createClaudeData(req, res) {
//         try {
//             const newData = await this.claudeService.createData(req.body);
//             res.status(201).json(newData);
//         } catch (error) {
//             res.status(500).json({ error: error.message });
//         }
//     }

//     async updateClaudeData(req, res) {
//         try {
//             const updatedData = await this.claudeService.updateData(req.params.id, req.body);
//             res.status(200).json(updatedData);
//         } catch (error) {
//             res.status(500).json({ error: error.message });
//         }
//     }

//     async deleteClaudeData(req, res) {
//         try {
//             await this.claudeService.deleteData(req.params.id);
//             res.status(204).send();
//         } catch (error) {
//             res.status(500).json({ error: error.message });
//         }
//     }
// }

// module.exports = ClaudeController;