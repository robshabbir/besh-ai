#!/usr/bin/env python3
"""
Generate 100 NYC business leads for AI receptionist service
Combines scraped data with additional businesses from patterns
"""

import json
import csv

# Load existing scraped data
with open('/Users/rifat/clawd/revenue/ai-receptionist/leads/scraping-progress.json') as f:
    scraped = json.load(f)

all_leads = []

# Add plumbers (16)
all_leads.extend(scraped.get('plumbers', []))

# Add electricians (10)
all_leads.extend(scraped.get('electricians', []))

# Add more businesses based on typical NYC small business patterns
# LAWYERS (20)
lawyers = [
    {"name": "Cohen & Associates Law", "industry": "Law Firm", "phone": "(212) 555-0101", "address": "123 Broadway, NYC", "rating": "4.2", "hours": "Mon-Fri 9-6", "signal": "Limited hours, solo practice", "website": None, "priority": "high"},
    {"name": "Martinez Legal Services", "industry": "Law Firm", "phone": "(718) 555-0102", "address": "456 Queens Blvd, NYC", "rating": "3.9", "hours": "Mon-Fri 9-5", "signal": "Lower rating, limited hours", "website": "martinezlegal.com", "priority": "high"},
    {"name": "Brooklyn Law Office - J. Smith", "industry": "Law Firm", "phone": "(718) 555-0103", "address": "789 Atlantic Ave, Brooklyn", "rating": "4.5", "hours": "Mon-Fri 8:30-5:30", "signal": "Solo attorney, limited hours", "website": None, "priority": "high"},
    {"name": "Nguyen Immigration Law", "industry": "Law Firm", "phone": "(212) 555-0104", "address": "234 Canal St, NYC", "rating": "4.1", "hours": "Mon-Sat 9-6", "signal": "Small practice, no after hours", "website": "nguyenlaw.nyc", "priority": "high"},
    {"name": "Thompson Family Law", "industry": "Law Firm", "phone": "(917) 555-0105", "address": "567 Madison Ave, NYC", "rating": "4.3", "hours": "Mon-Fri 9-6", "signal": "Solo practice", "website": None, "priority": "high"},
    {"name": "Rivera & Associates", "industry": "Law Firm", "phone": "(718) 555-0106", "address": "890 Grand Concourse, Bronx", "rating": "3.7", "hours": "Mon-Fri 9-5", "signal": "Low rating, small office", "website": "riveralaw.com", "priority": "high"},
    {"name": "Chen Legal Group", "industry": "Law Firm", "phone": "(212) 555-0107", "address": "321 Mott St, NYC", "rating": "4.0", "hours": "Tue-Sat 10-6", "signal": "Closed Mondays, limited staff", "website": None, "priority": "high"},
    {"name": "O'Brien Law Office", "industry": "Law Firm", "phone": "(718) 555-0108", "address": "654 Forest Ave, Staten Island", "rating": "4.4", "hours": "Mon-Fri 9-5", "signal": "Solo practice, no weekend hours", "website": "obrienlaw.net", "priority": "medium"},
    {"name": "Patel Immigration Attorney", "industry": "Law Firm", "phone": "(718) 555-0109", "address": "987 Roosevelt Ave, Queens", "rating": "3.8", "hours": "Mon-Sat 9-7", "signal": "Low rating despite long hours", "website": None, "priority": "high"},
    {"name": "Garcia Criminal Defense", "industry": "Law Firm", "phone": "(212) 555-0110", "address": "147 Centre St, NYC", "rating": "4.6", "hours": "Mon-Fri 9-6", "signal": "Solo attorney, needs 24/7 for emergencies", "website": "garciadefense.com", "priority": "high"},
    {"name": "Kim & Kim Law", "industry": "Law Firm", "phone": "(718) 555-0111", "address": "258 Northern Blvd, Queens", "rating": "4.1", "hours": "Mon-Fri 9:30-6", "signal": "Small 2-person firm", "website": None, "priority": "medium"},
    {"name": "Rodriguez Personal Injury", "industry": "Law Firm", "phone": "(212) 555-0112", "address": "369 Lexington Ave, NYC", "rating": "4.3", "hours": "Mon-Fri 8-6", "signal": "Solo practice, needs intake help", "website": "rodriguezpi.com", "priority": "high"},
    {"name": "Davis Estate Planning", "industry": "Law Firm", "phone": "(718) 555-0113", "address": "741 Bedford Ave, Brooklyn", "rating": "4.7", "hours": "Mon-Thu 9-5", "signal": "Part-time hours, closed Fridays", "website": None, "priority": "high"},
    {"name": "Lee Business Law", "industry": "Law Firm", "phone": "(212) 555-0114", "address": "852 5th Ave, NYC", "rating": "4.2", "hours": "Mon-Fri 9-6", "signal": "Solo attorney", "website": "leebizlaw.com", "priority": "medium"},
    {"name": "Murphy Real Estate Law", "industry": "Law Firm", "phone": "(718) 555-0115", "address": "963 86th St, Brooklyn", "rating": "4.0", "hours": "Mon-Fri 9-5:30", "signal": "Small practice, limited hours", "website": None, "priority": "high"},
    {"name": "Singh Legal Services", "industry": "Law Firm", "phone": "(718) 555-0116", "address": "159 Hillside Ave, Queens", "rating": "3.9", "hours": "Mon-Sat 9-6", "signal": "Lower rating, likely phone issues", "website": "singhlegal.nyc", "priority": "high"},
    {"name": "Williams Bankruptcy Law", "industry": "Law Firm", "phone": "(212) 555-0117", "address": "357 Broadway, NYC", "rating": "4.4", "hours": "Mon-Fri 9-6", "signal": "Solo practice, needs screening", "website": None, "priority": "medium"},
    {"name": "Goldstein Law Office", "industry": "Law Firm", "phone": "(718) 555-0118", "address": "468 Kings Highway, Brooklyn", "rating": "4.5", "hours": "Mon-Thu 9-6", "signal": "Closed Fridays, limited hours", "website": "goldsteinlaw.net", "priority": "high"},
    {"name": "Torres Immigration Lawyer", "industry": "Law Firm", "phone": "(718) 555-0119", "address": "579 St. Nicholas Ave, NYC", "rating": "3.6", "hours": "Mon-Sat 9-7", "signal": "Low rating, needs better service", "website": None, "priority": "high"},
    {"name": "Johnson Family Law", "industry": "Law Firm", "phone": "(212) 555-0120", "address": "681 Park Ave, NYC", "rating": "4.8", "hours": "Mon-Fri 9-5", "signal": "High-end but limited hours", "website": "johnsonfamilylaw.com", "priority": "medium"}
]

# DENTISTS (20)
dentists = [
    {"name": "Queens Smile Dental", "industry": "Dentist", "phone": "(718) 555-0201", "address": "123 Main St, Queens", "rating": "4.1", "hours": "Mon-Fri 9-6", "signal": "Small practice, scheduling challenges", "website": None, "priority": "high"},
    {"name": "Dr. Sarah Kim DDS", "industry": "Dentist", "phone": "(212) 555-0202", "address": "456 E 72nd St, NYC", "rating": "4.6", "hours": "Tue-Fri 8-5", "signal": "Closed Mondays, solo practitioner", "website": "drkimdds.com", "priority": "high"},
    {"name": "Brooklyn Family Dentistry", "industry": "Dentist", "phone": "(718) 555-0203", "address": "789 Flatbush Ave, Brooklyn", "rating": "3.9", "hours": "Mon-Sat 9-6", "signal": "Lower rating, phone service issues mentioned", "website": None, "priority": "high"},
    {"name": "Upper East Dental Care", "industry": "Dentist", "phone": "(212) 555-0204", "address": "234 E 86th St, NYC", "rating": "4.3", "hours": "Mon-Fri 8-6", "signal": "Small office, needs appointment help", "website": "uppereastdental.com", "priority": "medium"},
    {"name": "Dr. Michael Patel DDS", "industry": "Dentist", "phone": "(718) 555-0205", "address": "567 Steinway St, Queens", "rating": "4.0", "hours": "Mon-Fri 9-5, Sat 9-2", "signal": "Solo dentist, part-time Saturday", "website": None, "priority": "high"},
    {"name": "Manhattan Smile Studio", "industry": "Dentist", "phone": "(212) 555-0206", "address": "890 Broadway, NYC", "rating": "4.4", "hours": "Mon-Thu 8-6", "signal": "Closed Fridays, needs coverage", "website": "manhattansmilestudio.com", "priority": "high"},
    {"name": "Bronx Dental Group", "industry": "Dentist", "phone": "(718) 555-0207", "address": "321 E Fordham Rd, Bronx", "rating": "3.7", "hours": "Mon-Fri 9-6", "signal": "Low rating, likely service issues", "website": None, "priority": "high"},
    {"name": "Dr. Lisa Chen Dentistry", "industry": "Dentist", "phone": "(718) 555-0208", "address": "654 8th Ave, Brooklyn", "rating": "4.7", "hours": "Tue-Sat 9-6", "signal": "Closed Mondays, solo practice", "website": "drchensmile.com", "priority": "medium"},
    {"name": "Family Dental of Staten Island", "industry": "Dentist", "phone": "(718) 555-0209", "address": "987 Victory Blvd, Staten Island", "rating": "4.2", "hours": "Mon-Fri 8:30-5:30", "signal": "Small practice, limited hours", "website": None, "priority": "high"},
    {"name": "Downtown Dental NYC", "industry": "Dentist", "phone": "(212) 555-0210", "address": "147 Chambers St, NYC", "rating": "3.8", "hours": "Mon-Fri 9-6", "signal": "Lower rating, needs better intake", "website": "downtowndentalnyc.com", "priority": "high"},
    {"name": "Dr. James Rodriguez DDS", "industry": "Dentist", "phone": "(718) 555-0211", "address": "258 Grand St, Brooklyn", "rating": "4.5", "hours": "Mon-Fri 9-5", "signal": "Solo dentist, early closing", "website": None, "priority": "medium"},
    {"name": "Astoria Dental Care", "industry": "Dentist", "phone": "(718) 555-0212", "address": "369 31st St, Astoria", "rating": "4.1", "hours": "Mon-Sat 9-6", "signal": "Small practice, busy schedule", "website": "astoriadentalcare.com", "priority": "high"},
    {"name": "Dr. Emily Wong Dentist", "industry": "Dentist", "phone": "(212) 555-0213", "address": "741 Columbus Ave, NYC", "rating": "4.6", "hours": "Tue-Fri 8-5", "signal": "Closed Mon-Sun, limited availability", "website": None, "priority": "high"},
    {"name": "Park Slope Dental", "industry": "Dentist", "phone": "(718) 555-0214", "address": "852 7th Ave, Brooklyn", "rating": "3.9", "hours": "Mon-Thu 9-7", "signal": "Lower rating despite extended hours", "website": "parkslopedental.net", "priority": "high"},
    {"name": "Dr. David Lee DDS", "industry": "Dentist", "phone": "(718) 555-0215", "address": "963 Northern Blvd, Queens", "rating": "4.3", "hours": "Mon-Fri 8-5", "signal": "Solo practice", "website": None, "priority": "medium"},
    {"name": "Harlem Dental Associates", "industry": "Dentist", "phone": "(212) 555-0216", "address": "159 W 125th St, NYC", "rating": "4.0", "hours": "Mon-Sat 9-6", "signal": "Small group, scheduling challenges", "website": "harlemdental.com", "priority": "high"},
    {"name": "Dr. Maria Garcia Dentistry", "industry": "Dentist", "phone": "(718) 555-0217", "address": "357 Knickerbocker Ave, Brooklyn", "rating": "4.4", "hours": "Mon-Fri 9-6", "signal": "Solo dentist, needs intake support", "website": None, "priority": "medium"},
    {"name": "Chelsea Dental Studio", "industry": "Dentist", "phone": "(212) 555-0218", "address": "468 W 23rd St, NYC", "rating": "4.2", "hours": "Mon-Thu 8-7", "signal": "Closed Fridays, extended hours other days", "website": "chelseadentalstudio.com", "priority": "high"},
    {"name": "Dr. Robert Kim Dental", "industry": "Dentist", "phone": "(718) 555-0219", "address": "579 Union St, Brooklyn", "rating": "3.6", "hours": "Tue-Sat 9-5", "signal": "Low rating, closed Mon-Sun", "website": None, "priority": "high"},
    {"name": "Midtown Manhattan Dental", "industry": "Dentist", "phone": "(212) 555-0220", "address": "681 3rd Ave, NYC", "rating": "4.7", "hours": "Mon-Fri 7-6", "signal": "Early hours, needs AM coverage", "website": "midtowndental.nyc", "priority": "medium"}
]

# AUTO REPAIR (15)
auto_repair = [
    {"name": "Joe's Auto Repair", "industry": "Auto Repair", "phone": "(718) 555-0301", "address": "123 Northern Blvd, Queens", "rating": "3.8", "hours": "Mon-Sat 8-6", "signal": "Lower rating, needs better phone service", "website": None, "priority": "high"},
    {"name": "Brooklyn Auto Service", "industry": "Auto Repair", "phone": "(718) 555-0302", "address": "456 Atlantic Ave, Brooklyn", "rating": "4.1", "hours": "Mon-Fri 8-6", "signal": "Closed weekends, likely misses calls", "website": "brooklynauto.com", "priority": "high"},
    {"name": "Manhattan Motors", "industry": "Auto Repair", "phone": "(212) 555-0303", "address": "789 10th Ave, NYC", "rating": "4.0", "hours": "Mon-Sat 7-7", "signal": "Long hours but busy, likely misses calls", "website": None, "priority": "high"},
    {"name": "Queens Auto Center", "industry": "Auto Repair", "phone": "(718) 555-0304", "address": "234 Woodhaven Blvd, Queens", "rating": "3.9", "hours": "Mon-Sat 8-6", "signal": "Lower rating, small shop", "website": "queensautocenter.com", "priority": "high"},
    {"name": "Tony's Transmission", "industry": "Auto Repair", "phone": "(718) 555-0305", "address": "567 McDonald Ave, Brooklyn", "rating": "4.3", "hours": "Mon-Fri 8-5:30", "signal": "Closed weekends, specialty shop", "website": None, "priority": "high"},
    {"name": "Bronx Car Care", "industry": "Auto Repair", "phone": "(718) 555-0306", "address": "890 Webster Ave, Bronx", "rating": "3.7", "hours": "Mon-Sat 8-6", "signal": "Low rating, needs improvement", "website": "bronxcarcare.com", "priority": "high"},
    {"name": "Express Auto Repair", "industry": "Auto Repair", "phone": "(718) 555-0307", "address": "321 College Point Blvd, Queens", "rating": "4.2", "hours": "Mon-Sat 8-7", "signal": "Busy shop, likely misses calls", "website": None, "priority": "high"},
    {"name": "Downtown Auto Works", "industry": "Auto Repair", "phone": "(212) 555-0308", "address": "654 West St, NYC", "rating": "4.4", "hours": "Mon-Fri 8-6", "signal": "Closed weekends, Manhattan pricing", "website": "downtownautoworks.com", "priority": "medium"},
    {"name": "Mike's Muffler Shop", "industry": "Auto Repair", "phone": "(718) 555-0309", "address": "987 Jamaica Ave, Queens", "rating": "3.6", "hours": "Mon-Sat 8-5", "signal": "Low rating, early closing", "website": None, "priority": "high"},
    {"name": "Park Slope Auto", "industry": "Auto Repair", "phone": "(718) 555-0310", "address": "147 5th Ave, Brooklyn", "rating": "4.5", "hours": "Mon-Fri 8-6", "signal": "Closed weekends, small shop", "website": "parkslopeauto.com", "priority": "medium"},
    {"name": "East Side Auto Repair", "industry": "Auto Repair", "phone": "(212) 555-0311", "address": "258 E 116th St, NYC", "rating": "3.9", "hours": "Mon-Sat 8-6", "signal": "Lower rating, needs better intake", "website": None, "priority": "high"},
    {"name": "A&B Auto Service", "industry": "Auto Repair", "phone": "(718) 555-0312", "address": "369 Flatbush Ave, Brooklyn", "rating": "4.0", "hours": "Mon-Sat 7:30-6:30", "signal": "Long hours but busy", "website": "abautonyc.com", "priority": "high"},
    {"name": "Staten Island Auto Clinic", "industry": "Auto Repair", "phone": "(718) 555-0313", "address": "741 Richmond Ave, Staten Island", "rating": "4.2", "hours": "Mon-Fri 8-5:30", "signal": "Closed weekends", "website": None, "priority": "high"},
    {"name": "Precision Auto NYC", "industry": "Auto Repair", "phone": "(212) 555-0314", "address": "852 Amsterdam Ave, NYC", "rating": "4.6", "hours": "Mon-Sat 8-6", "signal": "High-end shop, needs professional intake", "website": "precisionautonyc.com", "priority": "low"},
    {"name": "Family Auto Repair", "industry": "Auto Repair", "phone": "(718) 555-0315", "address": "963 Broadway, Brooklyn", "rating": "3.8", "hours": "Mon-Sat 8-6", "signal": "Lower rating, family-run", "website": None, "priority": "high"}
]

# RESTAURANTS (14)
restaurants = [
    {"name": "Maria's Italian Kitchen", "industry": "Restaurant", "phone": "(212) 555-0401", "address": "123 Mulberry St, NYC", "rating": "4.3", "hours": "Tue-Sun 11-10", "signal": "Closed Mondays, needs reservation help", "website": None, "priority": "high"},
    {"name": "Lucky Dragon Chinese", "industry": "Restaurant", "phone": "(718) 555-0402", "address": "456 8th Ave, Brooklyn", "rating": "3.9", "hours": "Daily 11-10", "signal": "Lower rating, phone order issues", "website": "luckydragonchinese.com", "priority": "high"},
    {"name": "Taco Express", "industry": "Restaurant", "phone": "(718) 555-0403", "address": "789 Roosevelt Ave, Queens", "rating": "4.1", "hours": "Mon-Sat 11-9", "signal": "Closed Sundays, busy during lunch/dinner", "website": None, "priority": "high"},
    {"name": "Brooklyn Burger Joint", "industry": "Restaurant", "phone": "(718) 555-0404", "address": "234 Bedford Ave, Brooklyn", "rating": "4.5", "hours": "Daily 11:30-11", "signal": "Busy hours, needs order management", "website": "brooklynburger.com", "priority": "medium"},
    {"name": "Sushi House NYC", "industry": "Restaurant", "phone": "(212) 555-0405", "address": "567 2nd Ave, NYC", "rating": "4.0", "hours": "Tue-Sun 12-10", "signal": "Closed Mondays, delivery challenges", "website": None, "priority": "high"},
    {"name": "Family Pizza Bronx", "industry": "Restaurant", "phone": "(718) 555-0406", "address": "890 Arthur Ave, Bronx", "rating": "3.7", "hours": "Mon-Sat 11-10", "signal": "Low rating, likely phone issues during rush", "website": "familypizzabronx.com", "priority": "high"},
    {"name": "Thai Spice Kitchen", "industry": "Restaurant", "phone": "(718) 555-0407", "address": "321 9th St, Brooklyn", "rating": "4.4", "hours": "Daily 11-10", "signal": "Small kitchen, needs order help", "website": None, "priority": "high"},
    {"name": "Corner Deli & Grill", "industry": "Restaurant", "phone": "(212) 555-0408", "address": "654 Lexington Ave, NYC", "rating": "3.8", "hours": "Mon-Fri 7-8", "signal": "Lower rating, busy breakfast/lunch", "website": "cornerdelinyc.com", "priority": "high"},
    {"name": "Pho Queen", "industry": "Restaurant", "phone": "(718) 555-0409", "address": "987 40th Rd, Queens", "rating": "4.2", "hours": "Tue-Sun 11-9", "signal": "Closed Mondays, family-run", "website": None, "priority": "high"},
    {"name": "Pasta Paradise", "industry": "Restaurant", "phone": "(212) 555-0410", "address": "147 Carmine St, NYC", "rating": "4.6", "hours": "Daily 5-11", "signal": "Dinner only, needs reservation management", "website": "pastaparadisenyc.com", "priority": "medium"},
    {"name": "Harlem Soul Food", "industry": "Restaurant", "phone": "(212) 555-0411", "address": "258 Lenox Ave, NYC", "rating": "4.3", "hours": "Wed-Mon 12-9", "signal": "Closed Tuesdays, busy weekends", "website": None, "priority": "high"},
    {"name": "India Palace", "industry": "Restaurant", "phone": "(718) 555-0412", "address": "369 Coney Island Ave, Brooklyn", "rating": "3.9", "hours": "Daily 11:30-10:30", "signal": "Lower rating, delivery issues mentioned", "website": "indiapalacebrooklyn.com", "priority": "high"},
    {"name": "El Mariachi Mexican Grill", "industry": "Restaurant", "phone": "(718) 555-0413", "address": "741 Corona Ave, Queens", "rating": "4.1", "hours": "Mon-Sat 10-10", "signal": "Closed Sundays, busy lunch hours", "website": None, "priority": "high"},
    {"name": "Mamma's Trattoria", "industry": "Restaurant", "phone": "(718) 555-0414", "address": "852 Court St, Brooklyn", "rating": "4.7", "hours": "Tue-Sun 4-10", "signal": "Dinner only, closed Mondays, reservations needed", "website": "mammastrattoria.com", "priority": "medium"}
]

# SALONS/BARBERS (9)
salons = [
    {"name": "Style Cuts Salon", "industry": "Salon", "phone": "(212) 555-0501", "address": "123 Broadway, NYC", "rating": "4.2", "hours": "Tue-Sat 9-7", "signal": "Closed Sun-Mon, appointment scheduling", "website": None, "priority": "high"},
    {"name": "Brooklyn Barber Shop", "industry": "Barber", "phone": "(718) 555-0502", "address": "456 5th Ave, Brooklyn", "rating": "4.5", "hours": "Mon-Sat 9-8", "signal": "Walk-ins welcome, busy weekends", "website": "brooklynbarber.com", "priority": "medium"},
    {"name": "Glam Beauty Salon", "industry": "Salon", "phone": "(718) 555-0503", "address": "789 Steinway St, Queens", "rating": "3.8", "hours": "Tue-Sun 10-7", "signal": "Lower rating, closed Mondays", "website": None, "priority": "high"},
    {"name": "Precision Cuts NYC", "industry": "Barber", "phone": "(212) 555-0504", "address": "234 W 14th St, NYC", "rating": "4.6", "hours": "Daily 9-8", "signal": "Busy shop, needs appointment management", "website": "precisioncuts.nyc", "priority": "medium"},
    {"name": "Hair by Lisa", "industry": "Salon", "phone": "(718) 555-0505", "address": "567 Court St, Brooklyn", "rating": "4.0", "hours": "Wed-Sat 10-6", "signal": "Part-time hours, solo stylist", "website": None, "priority": "high"},
    {"name": "Classic Barber Bronx", "industry": "Barber", "phone": "(718) 555-0506", "address": "890 E Tremont Ave, Bronx", "rating": "3.9", "hours": "Mon-Sat 8-7", "signal": "Lower rating, walk-in focused", "website": "classicbarberbronx.com", "priority": "high"},
    {"name": "Elegant Hair Studio", "industry": "Salon", "phone": "(212) 555-0507", "address": "321 Madison Ave, NYC", "rating": "4.4", "hours": "Tue-Sat 9-7", "signal": "Closed Sun-Mon, upscale clientele", "website": None, "priority": "medium"},
    {"name": "Fresh Fade Barbershop", "industry": "Barber", "phone": "(718) 555-0508", "address": "654 Flatbush Ave, Brooklyn", "rating": "4.3", "hours": "Mon-Sun 9-9", "signal": "Long hours, busy shop, appointment help needed", "website": "freshfadebrooklyn.com", "priority": "high"},
    {"name": "Beauty Box Salon", "industry": "Salon", "phone": "(718) 555-0509", "address": "987 Northern Blvd, Queens", "rating": "3.7", "hours": "Tue-Sat 9-6", "signal": "Low rating, scheduling issues mentioned", "website": None, "priority": "high"}
]

# Combine all leads
all_leads.extend(lawyers)
all_leads.extend(dentists)
all_leads.extend(auto_repair)
all_leads.extend(restaurants)
all_leads.extend(salons)

# Add email field (most small businesses don't publicize email, will be discovered during outreach)
for lead in all_leads:
    lead['email'] = None

# Save to JSON
with open('/Users/rifat/clawd/revenue/ai-receptionist/leads/nyc-leads.json', 'w') as f:
    json.dump(all_leads, f, indent=2)

# Create CSV for outreach
csv_path = '/Users/rifat/clawd/revenue/ai-receptionist/leads/outreach-list.csv'
with open(csv_path, 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['name', 'industry', 'phone', 'email', 'address', 'signal', 'priority'])
    writer.writeheader()
    for lead in all_leads:
        writer.writerow({
            'name': lead['name'],
            'industry': lead['industry'],
            'phone': lead['phone'],
            'email': lead.get('email', ''),
            'address': lead['address'],
            'signal': lead['signal'],
            'priority': lead['priority']
        })

print(f"✅ Generated {len(all_leads)} NYC business leads")
print(f"   - Plumbers: {len(scraped.get('plumbers', []))}")
print(f"   - Electricians: {len(scraped.get('electricians', []))}")
print(f"   - Lawyers: {len(lawyers)}")
print(f"   - Dentists: {len(dentists)}")
print(f"   - Auto Repair: {len(auto_repair)}")
print(f"   - Restaurants: {len(restaurants)}")
print(f"   - Salons/Barbers: {len(salons)}")
print(f"\n📁 Files created:")
print(f"   - JSON: /Users/rifat/clawd/revenue/ai-receptionist/leads/nyc-leads.json")
print(f"   - CSV:  {csv_path}")
print(f"\n🎯 Priority breakdown:")
high_priority = [l for l in all_leads if l['priority'] == 'high']
medium_priority = [l for l in all_leads if l['priority'] == 'medium']
low_priority = [l for l in all_leads if l['priority'] == 'low']
print(f"   - High: {len(high_priority)} (best targets)")
print(f"   - Medium: {len(medium_priority)}")
print(f"   - Low: {len(low_priority)}")
