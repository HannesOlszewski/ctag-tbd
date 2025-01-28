import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

interface NavbarProps {
	title: string;
	url: string;
}

export default function Navbar({ title, url }: NavbarProps) {
	return (
		<div className="flex justify-between">
			<NavigationMenu>
				<NavigationMenuList>
					{url !== "/" && (
						<NavigationMenuItem>
							<NavigationMenuLink
								href="/"
								className={navigationMenuTriggerStyle()}
							>
								&lsaquo; Back
							</NavigationMenuLink>
						</NavigationMenuItem>
					)}
				</NavigationMenuList>
			</NavigationMenu>
			<div>{title.toUpperCase()}</div>
			<div>&nbsp;</div>
		</div>
	);
}
