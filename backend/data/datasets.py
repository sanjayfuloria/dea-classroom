"""
Built-in datasets for the DEA Classroom app.
Each dataset is ready for immediate use in teaching.
"""

BUILTIN_DATASETS = {
    "bank_branches_tutorial": {
        "id": "bank_branches_tutorial",
        "name": "Bank Branches — Tutorial Dataset",
        "description": "5 bank branches from the MBA Service Operations Management course. A simple 2-input, 2-output dataset ideal for step-by-step manual verification.",
        "source": "IFHE Hyderabad — MBA Course Dataset",
        "sector": "Banking",
        "suggested_model": "CCR",
        "suggested_orientation": "input",
        "input_cols": ["Staff_FTEs", "Operating_Cost_Lakhs"],
        "output_cols": ["Loans_Processed", "Deposits_Cr"],
        "data": [
            {"DMU": "Branch A", "Staff_FTEs": 5,  "Operating_Cost_Lakhs": 15, "Loans_Processed": 120, "Deposits_Cr": 24},
            {"DMU": "Branch B", "Staff_FTEs": 8,  "Operating_Cost_Lakhs": 20, "Loans_Processed": 150, "Deposits_Cr": 25},
            {"DMU": "Branch C", "Staff_FTEs": 4,  "Operating_Cost_Lakhs": 12, "Loans_Processed": 100, "Deposits_Cr": 18},
            {"DMU": "Branch D", "Staff_FTEs": 10, "Operating_Cost_Lakhs": 28, "Loans_Processed": 160, "Deposits_Cr": 22},
            {"DMU": "Branch E", "Staff_FTEs": 6,  "Operating_Cost_Lakhs": 16, "Loans_Processed": 130, "Deposits_Cr": 26},
        ],
        "teaching_notes": "Branches A, C, E are efficient (θ=1.0). Branch B scores θ=0.90 (needs 10% fewer resources). Branch D scores θ=0.686 (31.4% inefficient — strongest teaching example). Peer for B and D is Branch C (scaled up). Use Branch D to demonstrate the two-stage improvement: radial contraction to θ×inputs, then slack elimination."
    },

    "indian_psu_banks": {
        "id": "indian_psu_banks",
        "name": "Indian Public Sector Banks",
        "description": "20 Indian public sector commercial banks evaluated on the intermediation approach. Inputs: deposits, labour costs, fixed assets. Outputs: advances, investments.",
        "source": "RBI Basic Statistical Returns (BSR) — Illustrative dataset",
        "sector": "Banking",
        "suggested_model": "BCC",
        "suggested_orientation": "input",
        "input_cols": ["Deposits_CrRs", "Labour_Cost_CrRs", "Fixed_Assets_CrRs"],
        "output_cols": ["Advances_CrRs", "Investments_CrRs"],
        "data": [
            {"DMU": "SBI",            "Deposits_CrRs": 420000, "Labour_Cost_CrRs": 22000, "Fixed_Assets_CrRs": 12000, "Advances_CrRs": 280000, "Investments_CrRs": 180000},
            {"DMU": "PNB",            "Deposits_CrRs": 120000, "Labour_Cost_CrRs": 8500,  "Fixed_Assets_CrRs": 4200,  "Advances_CrRs": 78000,  "Investments_CrRs": 52000},
            {"DMU": "BOB",            "Deposits_CrRs": 110000, "Labour_Cost_CrRs": 7800,  "Fixed_Assets_CrRs": 3900,  "Advances_CrRs": 72000,  "Investments_CrRs": 48000},
            {"DMU": "Canara Bank",    "Deposits_CrRs": 95000,  "Labour_Cost_CrRs": 7200,  "Fixed_Assets_CrRs": 3600,  "Advances_CrRs": 65000,  "Investments_CrRs": 42000},
            {"DMU": "Union Bank",     "Deposits_CrRs": 88000,  "Labour_Cost_CrRs": 6900,  "Fixed_Assets_CrRs": 3100,  "Advances_CrRs": 58000,  "Investments_CrRs": 38000},
            {"DMU": "Bank of India",  "Deposits_CrRs": 82000,  "Labour_Cost_CrRs": 6400,  "Fixed_Assets_CrRs": 2900,  "Advances_CrRs": 54000,  "Investments_CrRs": 35000},
            {"DMU": "Indian Bank",    "Deposits_CrRs": 65000,  "Labour_Cost_CrRs": 4800,  "Fixed_Assets_CrRs": 2400,  "Advances_CrRs": 45000,  "Investments_CrRs": 29000},
            {"DMU": "UCO Bank",       "Deposits_CrRs": 48000,  "Labour_Cost_CrRs": 4200,  "Fixed_Assets_CrRs": 1900,  "Advances_CrRs": 28000,  "Investments_CrRs": 22000},
            {"DMU": "Central Bank",   "Deposits_CrRs": 54000,  "Labour_Cost_CrRs": 4600,  "Fixed_Assets_CrRs": 2200,  "Advances_CrRs": 32000,  "Investments_CrRs": 24000},
            {"DMU": "IOB",            "Deposits_CrRs": 45000,  "Labour_Cost_CrRs": 3900,  "Fixed_Assets_CrRs": 1800,  "Advances_CrRs": 30000,  "Investments_CrRs": 19000},
            {"DMU": "Syndicate Bank", "Deposits_CrRs": 42000,  "Labour_Cost_CrRs": 3700,  "Fixed_Assets_CrRs": 1700,  "Advances_CrRs": 28500,  "Investments_CrRs": 17500},
            {"DMU": "Andhra Bank",    "Deposits_CrRs": 38000,  "Labour_Cost_CrRs": 3200,  "Fixed_Assets_CrRs": 1500,  "Advances_CrRs": 26000,  "Investments_CrRs": 16000},
            {"DMU": "Corp Bank",      "Deposits_CrRs": 35000,  "Labour_Cost_CrRs": 2900,  "Fixed_Assets_CrRs": 1400,  "Advances_CrRs": 24000,  "Investments_CrRs": 14500},
            {"DMU": "Allahabad Bank", "Deposits_CrRs": 33000,  "Labour_Cost_CrRs": 2700,  "Fixed_Assets_CrRs": 1300,  "Advances_CrRs": 22000,  "Investments_CrRs": 13000},
            {"DMU": "Dena Bank",      "Deposits_CrRs": 28000,  "Labour_Cost_CrRs": 2400,  "Fixed_Assets_CrRs": 1100,  "Advances_CrRs": 16000,  "Investments_CrRs": 11000},
            {"DMU": "Vijaya Bank",    "Deposits_CrRs": 30000,  "Labour_Cost_CrRs": 2600,  "Fixed_Assets_CrRs": 1200,  "Advances_CrRs": 20000,  "Investments_CrRs": 12000},
            {"DMU": "OBC",            "Deposits_CrRs": 62000,  "Labour_Cost_CrRs": 5100,  "Fixed_Assets_CrRs": 2300,  "Advances_CrRs": 43000,  "Investments_CrRs": 28000},
            {"DMU": "Punjab & Sind",  "Deposits_CrRs": 18000,  "Labour_Cost_CrRs": 1700,  "Fixed_Assets_CrRs": 800,   "Advances_CrRs": 11000,  "Investments_CrRs": 7500},
            {"DMU": "IDBI Bank",      "Deposits_CrRs": 75000,  "Labour_Cost_CrRs": 4100,  "Fixed_Assets_CrRs": 2800,  "Advances_CrRs": 55000,  "Investments_CrRs": 36000},
            {"DMU": "Uco Bank",       "Deposits_CrRs": 40000,  "Labour_Cost_CrRs": 3500,  "Fixed_Assets_CrRs": 1600,  "Advances_CrRs": 24000,  "Investments_CrRs": 18000},
        ],
        "teaching_notes": "Use BCC model due to significant size variation. Compare SBI vs smaller banks. Good for illustrating scale efficiency decomposition."
    },

    "district_hospitals": {
        "id": "district_hospitals",
        "name": "District Hospitals — Telangana",
        "description": "15 district-level public hospitals. Inputs: doctors, nurses, beds, expenditure. Outputs: OPD visits, IPD admissions, surgeries.",
        "source": "NITI Aayog Health Data — Illustrative dataset",
        "sector": "Healthcare",
        "suggested_model": "BCC",
        "suggested_orientation": "input",
        "input_cols": ["Doctors_FTE", "Nurses_FTE", "Beds", "Expenditure_LakhsRs"],
        "output_cols": ["OPD_Annual", "IPD_Annual", "Surgeries_Annual"],
        "data": [
            {"DMU": "Hyderabad GH",    "Doctors_FTE": 120, "Nurses_FTE": 280, "Beds": 800, "Expenditure_LakhsRs": 4500, "OPD_Annual": 180000, "IPD_Annual": 22000, "Surgeries_Annual": 8500},
            {"DMU": "Warangal DH",     "Doctors_FTE": 65,  "Nurses_FTE": 140, "Beds": 350, "Expenditure_LakhsRs": 2100, "OPD_Annual": 95000,  "IPD_Annual": 11000, "Surgeries_Annual": 4200},
            {"DMU": "Karimnagar DH",   "Doctors_FTE": 55,  "Nurses_FTE": 120, "Beds": 300, "Expenditure_LakhsRs": 1800, "OPD_Annual": 85000,  "IPD_Annual": 9500,  "Surgeries_Annual": 3800},
            {"DMU": "Nizamabad DH",    "Doctors_FTE": 48,  "Nurses_FTE": 105, "Beds": 250, "Expenditure_LakhsRs": 1550, "OPD_Annual": 72000,  "IPD_Annual": 8200,  "Surgeries_Annual": 3100},
            {"DMU": "Khammam DH",      "Doctors_FTE": 42,  "Nurses_FTE": 90,  "Beds": 220, "Expenditure_LakhsRs": 1300, "OPD_Annual": 65000,  "IPD_Annual": 7400,  "Surgeries_Annual": 2800},
            {"DMU": "Nalgonda DH",     "Doctors_FTE": 38,  "Nurses_FTE": 82,  "Beds": 200, "Expenditure_LakhsRs": 1200, "OPD_Annual": 60000,  "IPD_Annual": 6800,  "Surgeries_Annual": 2500},
            {"DMU": "Adilabad DH",     "Doctors_FTE": 32,  "Nurses_FTE": 70,  "Beds": 180, "Expenditure_LakhsRs": 1050, "OPD_Annual": 48000,  "IPD_Annual": 5500,  "Surgeries_Annual": 2000},
            {"DMU": "Medak DH",        "Doctors_FTE": 28,  "Nurses_FTE": 62,  "Beds": 160, "Expenditure_LakhsRs": 950,  "OPD_Annual": 44000,  "IPD_Annual": 4900,  "Surgeries_Annual": 1800},
            {"DMU": "Mahabubnagar DH", "Doctors_FTE": 30,  "Nurses_FTE": 65,  "Beds": 170, "Expenditure_LakhsRs": 1000, "OPD_Annual": 46000,  "IPD_Annual": 5200,  "Surgeries_Annual": 1900},
            {"DMU": "Ranga Reddy DH",  "Doctors_FTE": 52,  "Nurses_FTE": 115, "Beds": 280, "Expenditure_LakhsRs": 1700, "OPD_Annual": 78000,  "IPD_Annual": 9000,  "Surgeries_Annual": 3400},
            {"DMU": "Sangareddy DH",   "Doctors_FTE": 25,  "Nurses_FTE": 55,  "Beds": 140, "Expenditure_LakhsRs": 820,  "OPD_Annual": 38000,  "IPD_Annual": 4200,  "Surgeries_Annual": 1550},
            {"DMU": "Vikarabad DH",    "Doctors_FTE": 20,  "Nurses_FTE": 44,  "Beds": 110, "Expenditure_LakhsRs": 650,  "OPD_Annual": 30000,  "IPD_Annual": 3300,  "Surgeries_Annual": 1200},
            {"DMU": "Wanaparthy DH",   "Doctors_FTE": 18,  "Nurses_FTE": 40,  "Beds": 100, "Expenditure_LakhsRs": 600,  "OPD_Annual": 27000,  "IPD_Annual": 3000,  "Surgeries_Annual": 1100},
            {"DMU": "Suryapet DH",     "Doctors_FTE": 22,  "Nurses_FTE": 48,  "Beds": 120, "Expenditure_LakhsRs": 720,  "OPD_Annual": 33000,  "IPD_Annual": 3700,  "Surgeries_Annual": 1350},
            {"DMU": "Siddipet DH",     "Doctors_FTE": 26,  "Nurses_FTE": 58,  "Beds": 145, "Expenditure_LakhsRs": 870,  "OPD_Annual": 40000,  "IPD_Annual": 4500,  "Surgeries_Annual": 1650},
        ],
        "teaching_notes": "BCC essential here due to size variation. Use to discuss case-mix, quality of care, and environmental factors (rural vs urban catchment)."
    },

    "domestic_airlines": {
        "id": "domestic_airlines",
        "name": "Indian Domestic Airlines",
        "description": "8 Indian domestic airline operators. Inputs: fleet size, employees, fuel cost. Outputs: Revenue Passenger Km, on-time performance.",
        "source": "DGCA Annual Statistics — Illustrative dataset",
        "sector": "Aviation",
        "suggested_model": "CCR",
        "suggested_orientation": "input",
        "input_cols": ["Fleet_Size", "Employees", "Fuel_Cost_CrRs"],
        "output_cols": ["RPK_Millions", "OTP_Percent"],
        "data": [
            {"DMU": "IndiGo",    "Fleet_Size": 285, "Employees": 28000, "Fuel_Cost_CrRs": 12500, "RPK_Millions": 95000, "OTP_Percent": 82},
            {"DMU": "Air India", "Fleet_Size": 115, "Employees": 22000, "Fuel_Cost_CrRs": 5800,  "RPK_Millions": 35000, "OTP_Percent": 72},
            {"DMU": "SpiceJet",  "Fleet_Size": 85,  "Employees": 9500,  "Fuel_Cost_CrRs": 4200,  "RPK_Millions": 28000, "OTP_Percent": 68},
            {"DMU": "Vistara",   "Fleet_Size": 55,  "Employees": 5200,  "Fuel_Cost_CrRs": 2800,  "RPK_Millions": 18000, "OTP_Percent": 88},
            {"DMU": "GoFirst",   "Fleet_Size": 58,  "Employees": 5800,  "Fuel_Cost_CrRs": 2900,  "RPK_Millions": 16500, "OTP_Percent": 70},
            {"DMU": "AirAsia",   "Fleet_Size": 32,  "Employees": 3200,  "Fuel_Cost_CrRs": 1600,  "RPK_Millions": 10500, "OTP_Percent": 75},
            {"DMU": "Star Air",  "Fleet_Size": 12,  "Employees": 850,   "Fuel_Cost_CrRs": 480,   "RPK_Millions": 2800,  "OTP_Percent": 80},
            {"DMU": "Alliance",  "Fleet_Size": 8,   "Employees": 620,   "Fuel_Cost_CrRs": 320,   "RPK_Millions": 1800,  "OTP_Percent": 78},
        ],
        "teaching_notes": "Good for discussing LCC vs full-service efficiency. Use to teach strategic risk of frontier status (Q5 from the discussion questions)."
    },

    "hotel_properties": {
        "id": "hotel_properties",
        "name": "Hotel Properties — Pan India",
        "description": "12 hotel properties from Indian chains. Inputs: rooms, staff, energy cost. Outputs: RevPAR, occupancy rate, F&B revenue.",
        "source": "FHRAI India Hotel Survey — Illustrative dataset",
        "sector": "Hospitality",
        "suggested_model": "BCC",
        "suggested_orientation": "output",
        "input_cols": ["Rooms", "Staff_FTE", "Energy_Cost_LakhsRs"],
        "output_cols": ["RevPAR_Rs", "Occupancy_Pct", "FnB_Revenue_LakhsRs"],
        "data": [
            {"DMU": "Taj Mumbai",       "Rooms": 565, "Staff_FTE": 1800, "Energy_Cost_LakhsRs": 480, "RevPAR_Rs": 14500, "Occupancy_Pct": 72, "FnB_Revenue_LakhsRs": 1200},
            {"DMU": "ITC Chennai",      "Rooms": 480, "Staff_FTE": 1500, "Energy_Cost_LakhsRs": 400, "RevPAR_Rs": 12000, "Occupancy_Pct": 68, "FnB_Revenue_LakhsRs": 980},
            {"DMU": "Marriott Delhi",   "Rooms": 420, "Staff_FTE": 1300, "Energy_Cost_LakhsRs": 350, "RevPAR_Rs": 13500, "Occupancy_Pct": 75, "FnB_Revenue_LakhsRs": 850},
            {"DMU": "Hyatt Hyderabad",  "Rooms": 380, "Staff_FTE": 1100, "Energy_Cost_LakhsRs": 310, "RevPAR_Rs": 11000, "Occupancy_Pct": 70, "FnB_Revenue_LakhsRs": 720},
            {"DMU": "Westin Pune",      "Rooms": 290, "Staff_FTE": 820,  "Energy_Cost_LakhsRs": 235, "RevPAR_Rs": 9500,  "Occupancy_Pct": 73, "FnB_Revenue_LakhsRs": 580},
            {"DMU": "Radisson Jaipur",  "Rooms": 240, "Staff_FTE": 650,  "Energy_Cost_LakhsRs": 195, "RevPAR_Rs": 8200,  "Occupancy_Pct": 78, "FnB_Revenue_LakhsRs": 420},
            {"DMU": "Lemon Tree Ahm",   "Rooms": 150, "Staff_FTE": 280,  "Energy_Cost_LakhsRs": 95,  "RevPAR_Rs": 5800,  "Occupancy_Pct": 82, "FnB_Revenue_LakhsRs": 180},
            {"DMU": "OYO Premium Hyd",  "Rooms": 80,  "Staff_FTE": 65,   "Energy_Cost_LakhsRs": 32,  "RevPAR_Rs": 3200,  "Occupancy_Pct": 88, "FnB_Revenue_LakhsRs": 45},
            {"DMU": "Ibis Bengaluru",   "Rooms": 195, "Staff_FTE": 310,  "Energy_Cost_LakhsRs": 105, "RevPAR_Rs": 5200,  "Occupancy_Pct": 79, "FnB_Revenue_LakhsRs": 165},
            {"DMU": "Novotel Kolkata",  "Rooms": 270, "Staff_FTE": 720,  "Energy_Cost_LakhsRs": 210, "RevPAR_Rs": 7800,  "Occupancy_Pct": 71, "FnB_Revenue_LakhsRs": 380},
            {"DMU": "Ginger Nashik",    "Rooms": 60,  "Staff_FTE": 48,   "Energy_Cost_LakhsRs": 22,  "RevPAR_Rs": 2800,  "Occupancy_Pct": 85, "FnB_Revenue_LakhsRs": 28},
            {"DMU": "Treebo Coimbatore","Rooms": 45,  "Staff_FTE": 38,   "Energy_Cost_LakhsRs": 16,  "RevPAR_Rs": 2100,  "Occupancy_Pct": 83, "FnB_Revenue_LakhsRs": 18},
        ],
        "teaching_notes": "Use output-orientation — inputs (rooms) are fixed in the short run. OYO and Ginger show high efficiency despite small scale (asset-light model)."
    },

    "engineering_colleges": {
        "id": "engineering_colleges",
        "name": "Engineering Colleges — South India",
        "description": "18 autonomous engineering colleges evaluated on NIRF-inspired metrics. Inputs: faculty, labs, library. Outputs: placements, research publications, pass rate.",
        "source": "NIRF Data — Illustrative dataset",
        "sector": "Education",
        "suggested_model": "BCC",
        "suggested_orientation": "input",
        "input_cols": ["Faculty_FTE", "Lab_Area_SqFt", "Library_Budget_LakhsRs"],
        "output_cols": ["Placement_Pct", "Publications_Annual", "Pass_Rate_Pct"],
        "data": [
            {"DMU": "BITS Pilani Hyd",  "Faculty_FTE": 280, "Lab_Area_SqFt": 85000, "Library_Budget_LakhsRs": 120, "Placement_Pct": 92, "Publications_Annual": 380, "Pass_Rate_Pct": 96},
            {"DMU": "NIT Warangal",     "Faculty_FTE": 320, "Lab_Area_SqFt": 95000, "Library_Budget_LakhsRs": 140, "Placement_Pct": 88, "Publications_Annual": 420, "Pass_Rate_Pct": 94},
            {"DMU": "CBIT Hyd",         "Faculty_FTE": 180, "Lab_Area_SqFt": 55000, "Library_Budget_LakhsRs": 75,  "Placement_Pct": 82, "Publications_Annual": 95,  "Pass_Rate_Pct": 90},
            {"DMU": "VNIT Nagpur",      "Faculty_FTE": 290, "Lab_Area_SqFt": 88000, "Library_Budget_LakhsRs": 130, "Placement_Pct": 85, "Publications_Annual": 350, "Pass_Rate_Pct": 93},
            {"DMU": "MGIT Hyd",         "Faculty_FTE": 145, "Lab_Area_SqFt": 42000, "Library_Budget_LakhsRs": 58,  "Placement_Pct": 75, "Publications_Annual": 48,  "Pass_Rate_Pct": 85},
            {"DMU": "MVSR Hyd",         "Faculty_FTE": 155, "Lab_Area_SqFt": 46000, "Library_Budget_LakhsRs": 62,  "Placement_Pct": 78, "Publications_Annual": 52,  "Pass_Rate_Pct": 87},
            {"DMU": "VNR Vignana",      "Faculty_FTE": 195, "Lab_Area_SqFt": 60000, "Library_Budget_LakhsRs": 82,  "Placement_Pct": 85, "Publications_Annual": 75,  "Pass_Rate_Pct": 89},
            {"DMU": "CSCE Kurnool",     "Faculty_FTE": 120, "Lab_Area_SqFt": 35000, "Library_Budget_LakhsRs": 45,  "Placement_Pct": 65, "Publications_Annual": 22,  "Pass_Rate_Pct": 80},
            {"DMU": "RGUKT Basar",      "Faculty_FTE": 165, "Lab_Area_SqFt": 48000, "Library_Budget_LakhsRs": 68,  "Placement_Pct": 70, "Publications_Annual": 38,  "Pass_Rate_Pct": 88},
            {"DMU": "Osmania OUC",      "Faculty_FTE": 210, "Lab_Area_SqFt": 65000, "Library_Budget_LakhsRs": 92,  "Placement_Pct": 72, "Publications_Annual": 180, "Pass_Rate_Pct": 82},
            {"DMU": "Sreenidhi Inst",   "Faculty_FTE": 175, "Lab_Area_SqFt": 52000, "Library_Budget_LakhsRs": 70,  "Placement_Pct": 80, "Publications_Annual": 62,  "Pass_Rate_Pct": 88},
            {"DMU": "JNTUH Campus",     "Faculty_FTE": 240, "Lab_Area_SqFt": 72000, "Library_Budget_LakhsRs": 105, "Placement_Pct": 74, "Publications_Annual": 210, "Pass_Rate_Pct": 85},
            {"DMU": "Aurora Eng",       "Faculty_FTE": 130, "Lab_Area_SqFt": 38000, "Library_Budget_LakhsRs": 50,  "Placement_Pct": 72, "Publications_Annual": 28,  "Pass_Rate_Pct": 83},
            {"DMU": "Gokaraju Rangaraju","Faculty_FTE": 160, "Lab_Area_SqFt": 47000, "Library_Budget_LakhsRs": 65,  "Placement_Pct": 79, "Publications_Annual": 55,  "Pass_Rate_Pct": 87},
            {"DMU": "Vardhaman College", "Faculty_FTE": 140, "Lab_Area_SqFt": 41000, "Library_Budget_LakhsRs": 55,  "Placement_Pct": 68, "Publications_Annual": 35,  "Pass_Rate_Pct": 82},
            {"DMU": "Avanthi Inst",     "Faculty_FTE": 110, "Lab_Area_SqFt": 32000, "Library_Budget_LakhsRs": 42,  "Placement_Pct": 60, "Publications_Annual": 18,  "Pass_Rate_Pct": 78},
            {"DMU": "Malla Reddy Eng",  "Faculty_FTE": 150, "Lab_Area_SqFt": 44000, "Library_Budget_LakhsRs": 60,  "Placement_Pct": 73, "Publications_Annual": 32,  "Pass_Rate_Pct": 84},
            {"DMU": "Keshav Memorial",  "Faculty_FTE": 125, "Lab_Area_SqFt": 37000, "Library_Budget_LakhsRs": 48,  "Placement_Pct": 70, "Publications_Annual": 25,  "Pass_Rate_Pct": 81},
        ],
        "teaching_notes": "Education sector: note that NIRF weights quality differently. Good for discussing appropriate output selection and the limitation of placement % as the sole output."
    },
}


def get_dataset(dataset_id: str) -> dict | None:
    return BUILTIN_DATASETS.get(dataset_id)


def list_datasets() -> list[dict]:
    return [
        {
            "id": v["id"],
            "name": v["name"],
            "description": v["description"],
            "sector": v["sector"],
            "n_dmus": len(v["data"]),
            "n_inputs": len(v["input_cols"]),
            "n_outputs": len(v["output_cols"]),
            "suggested_model": v["suggested_model"],
        }
        for v in BUILTIN_DATASETS.values()
    ]
