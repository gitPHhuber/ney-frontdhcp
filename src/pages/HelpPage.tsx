/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { Accordion, AccordionItem } from '../components/ui/Accordion';

function HelpPage() {
    return (
        <div>
            <header className="page-header">
                <h1>Help & FAQ</h1>
            </header>
            <Accordion>
                <AccordionItem title="What is a DHCP Lease?">
                    <p>A DHCP lease is a temporary assignment of an IP address to a device on the network. The DHCP server 'leases' the IP address for a specific period. This allows for efficient use of a limited pool of IP addresses.</p>
                </AccordionItem>
                <AccordionItem title="What is the difference between a dynamic and a static lease?">
                    <p><strong>Dynamic Leases</strong> are assigned automatically from a pool of available IPs and can change over time. They are managed on the 'Leases' page.</p>
                    <p><strong>Static Leases (or Reservations)</strong> are permanent IP address assignments for specific devices, identified by their MAC address. This ensures a device like a server or printer always has the same IP. These are managed on the 'Static IPs' page.</p>
                </AccordionItem>
                <AccordionItem title="How do I manage the DHCP server?">
                    <p>First, you must connect to the server via the 'Settings' page by entering its IP address. Once connected, you can navigate to the 'DHCP Server' page to view its status, configuration, and logs. You can also start, stop, or restart the service from this page.</p>
                </AccordionItem>
                <AccordionItem title="What are Roles and Permissions?">
                    <p>Roles define a set of permissions that can be assigned to users. Permissions grant the ability to perform specific actions, like viewing leases, deleting users, or changing settings. An administrator can create custom roles and assign them to users in the 'Settings' page under User Management.</p>
                </AccordionItem>
                 <AccordionItem title="How do I generate a report?">
                    <p>Navigate to the 'Reports' page. You can use the Custom Report Builder to generate a report based on all current lease data. In the future, predefined reports will be available for more specific insights.</p>
                </AccordionItem>
            </Accordion>
        </div>
    );
}

export default HelpPage;