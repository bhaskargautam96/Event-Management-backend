import sql from "../../db/postgres.db.connection.js";
import SubType from "../../model/services/subType.schema.js";
import Type from "../../model/services/type.schema.js";
import User from "../../model/user/user.schema.js";
import ApiResponse from "../../utils/ApiResponse.js";


export const getAllDashboardCounts = async (req, res) => {
  try {
    const superAdminCount = await User.countDocuments(
        { role: "SUPERADMIN", isDelete: false },
    );
    const userCounts = await User.aggregate([
        {
            $facet: {
                totalUsers: [{ $count: "count" }],
                deletedUsers: [{ $match: { isDelete: true } }, { $count: "count" }],
                activeUsers: [{ $match: { isActive: true, isDelete: false } }, { $count: "count" }],
                blockedUsers: [{ $match: { isActive: false, isDelete: false } }, { $count: "count" }],
            },
        },
    ]);
    const categoriesCount = await Type.aggregate([
        {
            $facet: {
                totalCategories: [{ $count: "count" }],
                inActiveCategories: [{ $match: { isDelete: true } }, { $count: "count" }],
                activeCategories: [{ $match: { isDelete: false } }, { $count: "count" }],
            },
            
        },
    ]);
    const subCategoriesCount = await SubType.aggregate([
        {
            $facet: {
                totalSubCategories: [{ $count: "count" }],
                inActiveSubCategories: [{ $match: { isDelete: true } }, { $count: "count" }],
                activeSubCategories: [{ $match: { isDelete: false } }, { $count: "count" }],
            },
        },
    ]);
    const eventsCount = await sql`SELECT COUNT(*)::int AS count FROM events WHERE is_delete = false`;

     const data ={
        usersCount:{
            superAdmins: superAdminCount,
            totalUsers: userCounts[0].totalUsers[0]?.count || 0,
            deletedUsers: userCounts[0].deletedUsers[0]?.count || 0,
            activeUsers: userCounts[0].activeUsers[0]?.count || 0,
            blockedUsers: userCounts[0].blockedUsers[0]?.count || 0,
            totalEvents: eventsCount[0]?.count || 0,
        },
        categoriesCount: {
            totalCategories: categoriesCount[0]?.totalCategories[0]?.count || 0,
            activeCategories: categoriesCount[0]?.activeCategories[0]?.count || 0,
            inActiveCategories: categoriesCount[0]?.inActiveCategories[0]?.count || 0,
        },
        subCategoriesCount: {
            totalSubCategories: subCategoriesCount[0]?.totalSubCategories[0]?.count || 0,
            activeSubCategories: subCategoriesCount[0]?.activeSubCategories[0]?.count || 0,
            inActiveSubCategories: subCategoriesCount[0]?.inActiveSubCategories[0]?.count || 0,
        },
    
    }
    return res.status(200).json(
      new ApiResponse("Dashboard counts retrieved successfully", {
         data
      }),
    );
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  } 
};