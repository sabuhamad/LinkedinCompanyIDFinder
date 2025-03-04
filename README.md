# Linkedin CompanyID Finder
Finds LinkedIn Company ID from Company Name (attempts to convert it to direct url and then navigates to employee page HTML)

1. Clone repository to your desktop
   
2. Edit YOUR_LINKEDIN_COOKIE to be your linkedin cookie: https://sales-mind.ai/blog/how-to-find-linkedin-session-cookie#:~:text=Locate%20the%20Cookies%3A%20In%20the,is%20your%20LinkedIn%20session%20cookie.
   
3. Input all companies in companies.txt

Ex.
360 HOME OFFERS
ACCENT ON INDEPENDENCE

4. Run command: node idfinder.js companies.txt
   
5. Output will be in file company_ids.txt in the following format:
{company name} {ID}

Ex.
360 HOME OFFERS 93817013
ACCENT ON INDEPENDENCE 4005138 
   
