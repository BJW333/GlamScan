# Artificial Intelligence Powered Fashion Recommendation Platform
        
Create a detailed product specification for GlamScan, an AI-powered mobile application for outfit and makeup recommendations with integrated social interaction and affiliate marketing monetization. The specification should clearly define core functionality, UI/UX layout, and user flows, incorporating the following key elements:
* AI-driven style recommendation engine that provides outfit and makeup suggestions based on user selfies 
* Amazon affiliate integration for direct purchasing of recommended products, generating commission revenue
* Optional gender-based customization 
* Standard login/registration system with account creation
* Gender selection optional during sign-up
* Editable user profile with personal style preferences, profile photo, and posting ability
* Top Navigation with Profile Icon, Friend & Messaging System, and Settings Icon
* Bottom Navigation with 4 tabs: Style Combos/Packs, Home/Scanner, Hot or Not Voting, and Saved Items
* Style Combos/Packs: Curated Amazon outfit bundles, paid placements from brands, seasonal trends, personalized recommendations based on user history
* Home/Scanner: Camera-based style capture, AI-generated style/makeup recommendations, option to purchase or save, Integrated Chatbot button for style Q&A
* Hot or Not Voting: TikTok-style vertical feed of creator-submitted posts with product tags and “Buy” links, swipe right to upvote/save, swipe left to skip/downvote, real-time vote counts, expandable comment panel, friend/DM actions in post headers, post sharing, and analytics tracking
* Saved Items: Centralized collection of saved outfits/makeup from both the scanner and voting system, all linked to affiliate purchasing
* Real-time notifications for friend requests, messages, comment replies, and mentions
* In-app DMs with read receipts, typing indicators, image/post sharing, and moderation tools
* Commenting system with expandable threads
* Integrated engagement analytics for both users and the platform
* Primary revenue from Amazon affiliate links
* Secondary revenue from sponsored placements in Style Combos/Packs
* Potential premium features for advanced AI recommendations or exclusive content 
* AI integration for real-time image analysis 
* Integration with Amazon affiliate program for affiliate marketing monetization

Made with Floot.

# Instruction

For security reasons, the env.json file is not populated - you will need to generate or retrive the values yourself. For JWT secrets, you need to generate it with

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then paste the value.

For Floot Database, you need to request a pg_dump from support and upload it to your own postgres database, then fill up the connection string value.

Floot OAuth will not work in self-hosting environments.

For other exteranal services, retrive your API keys and fill up the values.

Then, you can build and start the service with this:

```
npm install -g pnpm
pnpm install
pnpm vite build
pnpm tsx server.ts
```
