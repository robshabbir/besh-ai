#!/usr/bin/env python3
"""
Compile NYC business leads for AI receptionist service
"""

import json

# Data collected from Google Maps snapshots
electricians = [
    {
        "name": "Forest Hills Electrical Contracting Inc.",
        "industry": "Electrician",
        "phone": "(718) 894-4113",
        "address": "67-54 73rd Place, NYC",
        "rating": "3.8",
        "hours": "Closed · Opens 8 AM",
        "signal": "Lower rating + limited hours - likely phone issues",
        "website": "foresthillselectric.com",
        "priority": "high"
    },
    {
        "name": "Mauceri Electric",
        "industry": "Electrician",
        "phone": "(347) 305-6091",
        "address": "75-02 67th Dr, NYC",
        "rating": "4.0",
        "hours": "Closed · Opens 6:30 AM",
        "signal": "Limited hours - needs after-hours coverage",
        "website": "maucerielectric.com",
        "priority": "high"
    },
    {
        "name": "Tosi Electric",
        "industry": "Electrician",
        "phone": "(646) 842-3181",
        "address": "70-45 65th Pl, NYC",
        "rating": "5.0",
        "hours": "Closed · Opens 6 AM",
        "signal": "Limited hours, no website visible",
        "website": None,
        "priority": "high"
    },
    {
        "name": "Power Flow Electric",
        "industry": "Electrician",
        "phone": "(718) 690-2750",
        "address": "83-18 Parsons Boulevard, NYC",
        "rating": "5.0",
        "hours": "Open 24 hours",
        "signal": "24/7 but sponsored ad suggests well-funded",
        "website": "powerflowelectrics.com",
        "priority": "low"
    },
    {
        "name": "ELectric A/C Inc",
        "industry": "Electrician",
        "phone": "(718) 374-6757",
        "address": "69-59 75th St, NYC",
        "rating": "5.0",
        "hours": "Open 24 hours",
        "signal": "24/7 availability",
        "website": "electricacinc.com",
        "priority": "low"
    },
    {
        "name": "Forest Hills Electrical",
        "industry": "Electrician/Contractor",
        "phone": "(718) 894-4113",
        "address": "67-54 73rd Pl, NYC",
        "rating": "5.0",
        "hours": "Not listed",
        "signal": "No hours listed",
        "website": "foresthillselectric.com",
        "priority": "medium"
    },
    {
        "name": "NYC Precision Electrical LLC",
        "industry": "Electrician",
        "phone": "(516) 300-0192",
        "address": "118-66 Metropolitan Ave Apt 3d, NYC",
        "rating": "5.0",
        "hours": "Open 24 hours",
        "signal": "Apartment-based - likely solo operator",
        "website": "nycprecisionelectrical.com",
        "priority": "high"
    },
    {
        "name": "Power Electric NY",
        "industry": "Electrician",
        "phone": "(929) 422-9063",
        "address": "110 N 1st St, NYC",
        "rating": "5.0",
        "hours": "Open 24 hours",
        "signal": "24/7 availability",
        "website": "powerelectricnyinc.com",
        "priority": "low"
    },
    {
        "name": "New York City Electricians",
        "industry": "Electrician",
        "phone": "(646) 340-9882",
        "address": "50 St Marks Pl, NYC",
        "rating": "4.7",
        "hours": "Open 24 hours",
        "signal": "24/7 availability",
        "website": "newyorkcityelectricianss.com",
        "priority": "low"
    },
    {
        "name": "Electrician NYC LLC",
        "industry": "Electrician",
        "phone": "(212) 547-8867",
        "address": "489 5th Ave Lobby, NYC",
        "rating": "4.9",
        "hours": "Open 24 hours",
        "signal": "24/7 availability, well-established",
        "website": "electriciannyc.com",
        "priority": "low"
    }
]

# Placeholder for other categories - will be populated from browser scraping
lawyers = []
dentists = []
auto_repair = []
restaurants = []
salons = []

def save_progress():
    """Save current progress"""
    data = {
        "electricians": electricians,
        "lawyers": lawyers,
        "dentists": dentists,
        "auto_repair": auto_repair,
        "restaurants": restaurants,
        "salons": salons
    }
    
    with open('/Users/rifat/clawd/revenue/ai-receptionist/leads/scraping-progress.json', 'r') as f:
        existing = json.load(f)
    
    existing['electricians'] = electricians
    
    with open('/Users/rifat/clawd/revenue/ai-receptionist/leads/scraping-progress.json', 'w') as f:
        json.dump(existing, f, indent=2)
    
    print(f"Saved {len(electricians)} electricians")

if __name__ == "__main__":
    save_progress()
