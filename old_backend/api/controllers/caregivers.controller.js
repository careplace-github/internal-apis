import UsersDAO from "../../dao/usersDAO.js"

export default class CaregiversController {
    static async apiGetCaregivers(req, res, next) {
        const caregiversPerPage = req.query.caregiversPerPage ? parseInt(req.query.caregiversPerPage, 10): 20
        const page = req.query.page ? parseInt (req.query.page, 10) : 0

        let filters = {}
            if (req.query.age) {
                filters.age = req.query.age
            } else if (req.query.rating) {
                filters.rating = req.query.age
            } else if (req.query.workExperience) {
                filters.workExperience = req.query.workExperience
            } else if (req.query.name) {
                filters.name = req.query.name
            }

            const { caregiversList, totalNumCaregivers } = await CaregiversDAO.getCaregivers({
                filters,
                page,
                caregiversPerPage,
            })

            let response = {
                caregivers: caregiversList,
                page: page,
                filters: filters,
                entrier_per_page: caregiversPerPage,
                total_results: totalNumCaregivers,
            }
            res.json(response)
        
    }



    static async apiGetCaregiverById(req, res, next) {

        try{
            let id = req.parans.id || {}
            let caregiver = await CaregiversDAO.getCaregiverByID(id)

        if (!caregiver) {
            res.status(404).json({ error: "Not found" })
            return
        }
        res.json(caregiver)
    } catch (e) {
        console.log(`api, ${e}`)
        res.status(500).json({ error: e})
    }
        
    }

}