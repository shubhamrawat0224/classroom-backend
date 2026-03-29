import { and, desc, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import express from "express";
import { departments, subjects } from "../db/schema";
import { db } from "../db";
import { get } from "node:http";

const router = express.Router();
// get all subjects with optional search, filtering and pagination
router.get("/", async(req, res)=>{
    try{
        const { search, department, page = "1", limit = "10" } = req.query;

        const parsePositiveInt = (value: unknown, fallback: number) => {
            const n = Number.parseInt(String(value), 10);
            return Number.isFinite(n) && n > 0 ? n : fallback;
        };

        const currentPage = parsePositiveInt(page, 1);
        const limitPerPage = Math.min(parsePositiveInt(limit, 10), 100);

        const offset = (currentPage - 1) * limitPerPage;
        const filterConditions = [];
        if(search){
            filterConditions.push(
                or(
                    ilike(subjects.name, `%${search}%`),
                    ilike(subjects.Code, `%${search}%`),                   
                )
            );
        }
        if(department){
            filterConditions.push(
                ilike(departments.name, `%${department}%`)
            )
        }
        const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db.select(
            { count: sql<number>`count(*)` })
            .from(subjects)
            .leftJoin(departments, eq(subjects.departmentId,departments.id))
            .where(whereClause);

        const total = countResult[0]?.count ?? 0;
        const subjectsList = await db.select(
            {
                ...getTableColumns(subjects),
                departments:{...getTableColumns(departments)}
            }
        ).from(subjects)
        .leftJoin(departments, eq(subjects.departmentId,departments.id))
        .where(whereClause)
        .orderBy(desc(subjects.created_at))
        .limit(limitPerPage)
        .offset(offset);
        res.status(200).json(
            {
                data: subjectsList,
                pagination: {
                    page: currentPage,
                    limit: limitPerPage,
                    total,
                    totalPages: Math.ceil(total/limitPerPage)
                }
            }
        )
    }catch(error){
        console.log("Get /subjects error:",error);
        res.status(500).json({error: "Failed to get subjects"})
    }
})

export default router;