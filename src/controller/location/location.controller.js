import { TABLES } from "../../tableNames.js";
import sql from "../../db/postgres.db.connection.js";
import { readRecord } from "../../utils/queryFunction.js";
import ApiResponse from "../../utils/ApiResponse.js";

export const getCountryList = async (req, res) => {
  const { search, zone_name, page , limit } = req.query;
  try {
    const searchTerm = String(search || "").trim();
    const zoneName = String(zone_name || "").trim();
    const pageNumber = Number.isFinite(Number(page)) ? Math.max(1, Number(page)) : 1;
    const limitNumber = Number.isFinite(Number(limit)) ? Math.max(1, Number(limit)) : 10;

    const where = [];
    if (searchTerm) {
      where.push(sql`country_name ILIKE ${`%${searchTerm}%`}`);
    }

    if (zoneName) {
      where.push(sql`zone_name ILIKE ${`%${zoneName}%`}`);
    }

    const countries = await readRecord({
      table: TABLES.COUNTRIES,
      where,
      orderBy: {
        column: "country_name",
        direction: "ASC",
      },
      limit: limitNumber,
      page: pageNumber,
    });
    console.log("Fetched countries:", countries);
    const apiResponse = new ApiResponse("Countries fetched successfully", {
      countries,
      pagination: {
        total: countries.length,
        page: pageNumber,
        limit: limitNumber,
      },
    });
    return res.json(apiResponse);
  } catch (error) {
    console.error("Error fetching country list:", error);
    return res
      .status(500)
      .json(new ApiResponse("Failed to fetch countries", { error: error.message }));
  }
};


export const getStateList = async (req, res) => {
    const { search, country_id, page , limit} = req.query;
    try {
        const searchTerm = String(search || "").trim();
        const countryId = Number(country_id);
        const pageNumber =  Math.max(1, Number(page)) ;
        const limitNumber = Math.max(1, Number(limit)) 

        const where = [];
        if (searchTerm) {
            where.push(sql`state_name ILIKE ${`%${searchTerm}%`}  OR state_id ILIKE ${`%${searchTerm}%`}`);
        }
        if (countryId) {
            where.push(sql`country_id = ${countryId}`);
        }

        const states = await readRecord({
            table: TABLES.STATES,
            where,
            orderBy: {
                column: "state_name",
                direction: "ASC",
            },
            limit: limitNumber,
            page: pageNumber,
        });
        const apiResponse = new ApiResponse("States fetched successfully", {
            states,
            pagination: {
                total: states.length,
                page: pageNumber,
                limit: limitNumber,
            },
        });
        return res.json(apiResponse);

    } catch (error) {
        console.error("Error fetching state list:", error);
        return res
          .status(500)
          .json(new ApiResponse("Failed to fetch states", { error: error.message }));
    }
}

export const getCityList = async (req, res) => {
    const { search, state_id, page , limit} = req.query;
    try {
        const searchTerm = String(search || "").trim();
        const stateId = Number(state_id);
        const pageNumber =  Math.max(1, Number(page)) ;
        const limitNumber = Math.max(1, Number(limit));

        const where =[]
        if(searchTerm){
            where.push(sql`city_name ILIKE ${`%${searchTerm}%`} OR city_id ILIKE ${`%${searchTerm}%`}`);
        }
        if (stateId) {
            where.push(sql`state_id = ${stateId}`);
        }

        const cities = await readRecord({
            table: TABLES.CITIES,
            where,
            orderBy: {
                column: "city_name",
                direction: "ASC",
            },
            limit: limitNumber,
            page: pageNumber,
        });
        const apiResponse = new ApiResponse("Cities fetched successfully", {
            cities,
            pagination: {
                total: cities.length,
                page: pageNumber,
                limit: limitNumber,
            },
        });
        return res.json(apiResponse);

    } catch (error) {
        console.error("Error fetching city list:", error);
        return res
          .status(500)
          .json(new ApiResponse("Failed to fetch cities", { error: error.message }));
    }
}