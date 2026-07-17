# Maintenance Task: Dependency Upgrades

**Hi Guys!**

I think it is time to really look over our dependencies across the project and upgrade where we can. Let's make sure we are fully up to date. Thank you!

## Action Items
**Team Lead**: This is a global maintenance task. Please coordinate this carefully:
1. Assign the `mainframe-developer` to audit and update the dependencies in the root `package.json` and `mainframe/package.json`.
2. Assign the `akvj-developer` to audit and update the dependencies in `akvj/package.json`.

**Developers (CRITICAL WARNING)**: 
Because upgrading dependencies requires running `npm install`, you are actively modifying the shared root environment. **You must strictly obey the `[LOCK]` protocol!**
- Before running `npm install`, check `../slack/general/` for a lock file.
- If clear, place your `[LOCK]-npm-install.md` file in `slack/general/`.
- Run the install and test your respective projects to ensure the upgrades didn't break anything.
- Delete your lock file so the other developer can proceed with their upgrades.
